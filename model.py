"""PhishSignal ML: load model.pkl for serve; optional train; URL feature extract + analyze()."""

from __future__ import annotations

import datetime
import os
import pickle
import re
import threading
from pathlib import Path

import pandas as pd
import requests
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

MODEL_PATH = Path(os.getenv("MODEL_PATH", "model.pkl"))
DATASET_PATH = Path(os.getenv("DATASET_PATH", "apidataset.csv"))
FORCE_TRAIN = os.getenv("TRAIN_MODEL", "").strip().lower() in ("1", "true", "yes")

REALFEATURES = [
    "length_url",
    "length_hostname",
    "ip",
    "nb_dots",
    "nb_hyphens",
    "nb_at",
    "nb_qm",
    "nb_and",
    "nb_eq",
    "nb_slash",
    "nb_semicolumn",
    "nb_www",
    "nb_com",
    "https_token",
    "ratio_digits_url",
    "ratio_digits_host",
    "nb_subdomains",
    "tld_in_subdomain",
    "abnormal_subdomain",
    "prefix_suffix",
    "shortening_service",
    "length_words_raw",
    "shortest_word_host",
    "longest_words_raw",
    "longest_word_host",
    "longest_word_path",
    "avg_words_raw",
    "avg_word_host",
    "avg_word_path",
    "phish_hints",
    "suspecious_tld",
    "domain_age",
    "dns_record",
]


def train_and_save(dataset_path: Path = DATASET_PATH, out_path: Path = MODEL_PATH) -> dict:
    """Train RandomForest from CSV and write model.pkl. Used when pickle is missing or TRAIN_MODEL=1."""
    df = pd.read_csv(dataset_path)
    print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

    df["status"] = df["status"].map({"phishing": 1, "legitimate": 0})
    numerical = df[REALFEATURES + ["status"]]
    corr = numerical.corr()["status"]
    selected = [
        feature
        for feature, score in corr.items()
        if feature != "status" and abs(score) > 0.1
    ]
    print(f"Selected {len(selected)} features")

    x_train, x_test, y_train, y_test = train_test_split(
        df[selected],
        df["status"],
        test_size=0.25,
        random_state=42,
    )
    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train)
    x_test_scaled = scaler.transform(x_test)

    print("Training Random Forest...")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(x_train_scaled, y_train)
    accuracy = accuracy_score(y_test, clf.predict(x_test_scaled))
    print(f"Done! Accuracy: {round(accuracy * 100, 2)}%")

    payload = {"model": clf, "scaler": scaler, "features": selected}
    with open(out_path, "wb") as f:
        pickle.dump(payload, f)
    print(f"Model saved as {out_path}")
    return payload


def load_model(path: Path = MODEL_PATH) -> dict:
    with open(path, "rb") as f:
        return pickle.load(f)


if FORCE_TRAIN or not MODEL_PATH.exists():
    if not MODEL_PATH.exists():
        print(f"{MODEL_PATH} missing — training once before serve")
    saved = train_and_save()
else:
    print(f"Loading {MODEL_PATH} (set TRAIN_MODEL=1 to retrain)")
    saved = load_model()

model = saved["model"]
scaler = saved["scaler"]
selectedFeatures = saved["features"]

# In-process RDAP age cache (domain → days)
domainCache: dict[str, int] = {}


def getDomainAge(cleanDomain: str) -> int:
    if cleanDomain in domainCache:
        return domainCache[cleanDomain]

    result = {"age": -1}

    def do_rdap() -> None:
        try:
            resp = requests.get(f"https://rdap.org/domain/{cleanDomain}", timeout=3)
            if resp.status_code != 200:
                return
            data = resp.json()
            creation_date = None
            for event in data.get("events", []):
                if event.get("eventAction") == "registration":
                    creation_date = event.get("eventDate")
                    break
            if creation_date:
                parsed = datetime.datetime.fromisoformat(
                    creation_date.replace("Z", "+00:00")
                )
                now = datetime.datetime.now(datetime.timezone.utc)
                result["age"] = (now - parsed).days
        except Exception:
            pass

    thread = threading.Thread(target=do_rdap)
    thread.start()
    thread.join(timeout=3)

    if result["age"] > 0:
        domainCache[cleanDomain] = result["age"]
    return result["age"]


def extractFeatures(url: str):
    """Extract URL-structure features + human-readable signals (no page crawl)."""
    features: dict = {}
    signals: list[str] = []

    try:
        hostname = url.split("//")[1].split("/")[0]
    except Exception:
        hostname = ""

    try:
        path = (
            url.split("//")[1].split("/", 1)[1]
            if "/" in url.split("//")[1]
            else ""
        )
    except Exception:
        path = ""

    words_raw = [w for w in re.split(r"[\W_]+", url) if w]
    words_host = [w for w in re.split(r"[\W_]+", hostname) if w]
    words_path = [w for w in re.split(r"[\W_]+", path) if w]

    features["length_url"] = len(url)
    features["length_hostname"] = len(hostname)

    has_ip = bool(re.match(r"^\d+\.\d+\.\d+\.\d+$", hostname))
    features["ip"] = int(has_ip)
    if has_ip:
        signals.append("Domain is a raw IP address, legitimate websites never do this")

    features["nb_dots"] = url.count(".")
    features["nb_hyphens"] = url.count("-")
    features["nb_at"] = url.count("@")
    if url.count("@") > 0:
        signals.append("URL contains an @ symbol, browsers ignore everything before it")

    features["nb_qm"] = url.count("?")
    features["nb_and"] = url.count("&")
    features["nb_eq"] = url.count("=")
    features["nb_slash"] = url.count("/")
    features["nb_semicolumn"] = url.count(";")
    features["nb_www"] = 1 if "www." in url else 0
    features["nb_com"] = 1 if ".com" in url else 0

    uses_https = url.startswith("https")
    features["https_token"] = int(uses_https)
    if not uses_https:
        signals.append("Uses unencrypted HTTP with no SSL protection")

    features["ratio_digits_url"] = round(
        sum(c.isdigit() for c in url) / max(len(url), 1), 4
    )
    features["ratio_digits_host"] = round(
        sum(c.isdigit() for c in hostname) / max(len(hostname), 1), 4
    )

    parts = hostname.split(".")
    features["nb_subdomains"] = max(len(parts) - 2, 0)
    features["tld_in_subdomain"] = 1 if len(parts) > 2 else 0
    features["abnormal_subdomain"] = (
        1 if re.search(r"^(w[0-9]|www[0-9])", hostname) else 0
    )

    has_dash = "-" in hostname
    features["prefix_suffix"] = int(has_dash)
    if has_dash:
        signals.append(
            "Hostname contains hyphens, common in fake domains like paypal-secure.com"
        )

    is_shortened = bool(re.search(r"bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly", url))
    features["shortening_service"] = int(is_shortened)
    if is_shortened:
        signals.append("Uses a URL shortener, the real destination is hidden")

    features["length_words_raw"] = len(words_raw)
    features["shortest_word_host"] = min((len(w) for w in words_host), default=0)
    features["longest_words_raw"] = max((len(w) for w in words_raw), default=0)
    features["longest_word_host"] = max((len(w) for w in words_host), default=0)
    features["longest_word_path"] = max((len(w) for w in words_path), default=0)
    features["avg_words_raw"] = round(
        sum(len(w) for w in words_raw) / max(len(words_raw), 1), 4
    )
    features["avg_word_host"] = round(
        sum(len(w) for w in words_host) / max(len(words_host), 1), 4
    )
    features["avg_word_path"] = round(
        sum(len(w) for w in words_path) / max(len(words_path), 1), 4
    )

    has_phish_hints = bool(
        re.search(
            r"login|verify|secure|account|update|confirm|banking|payment",
            url.lower(),
        )
    )
    features["phish_hints"] = int(has_phish_hints)
    if has_phish_hints:
        signals.append("URL contains phishing keywords like login, verify, or secure")

    has_suspicious_tld = bool(
        re.search(r"\.xyz|\.top|\.club|\.online|\.site|\.ru|\.cn", url.lower())
    )
    features["suspecious_tld"] = int(has_suspicious_tld)
    if has_suspicious_tld:
        signals.append("Uses a suspicious top-level domain like .xyz, .top, or .ru")

    clean_domain = hostname.replace("www.", "")
    domain_age = getDomainAge(clean_domain)
    features["domain_age"] = domain_age
    features["dns_record"] = 1 if domain_age > 0 else 0

    if domain_age == -1:
        signals.append(
            "Domain has no WHOIS record, it may not exist or was just created"
        )
    elif domain_age < 30:
        signals.append(
            f"Domain is only {domain_age} days old, phishing sites are almost always newly registered"
        )
    elif domain_age < 180:
        signals.append(f"Domain is relatively new at {domain_age} days old")

    return features, signals


def analyze(url: str) -> dict:
    """Return `{ url, score, signals }` for FastAPI."""
    features, signals = extractFeatures(url)
    vector = pd.DataFrame(
        [features.get(col, 0) for col in selectedFeatures],
        index=selectedFeatures,
    ).T
    vector = scaler.transform(vector)
    proba = model.predict_proba(vector)[0]
    score = int(round(proba[1] * 100))

    if not signals and score >= 50:
        signals.append("Uncertain regarding phishing: no signals detected.")
    if not signals:
        signals.append("No phishing signals detected")

    return {"url": url, "score": score, "signals": signals}
