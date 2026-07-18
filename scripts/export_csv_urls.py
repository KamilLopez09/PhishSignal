"""Export a small set of usable URLs from apidataset.csv for UI fixtures + tests."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "apidataset.csv"
OUT = ROOT / "web" / "src" / "lib" / "fixtures" / "csv-urls.json"


def pick(df: pd.DataFrame, status: str, n: int = 6) -> list[dict]:
    sub = df[df["status"] == status].drop_duplicates("url").copy()
    sub["host"] = (
        sub["url"]
        .astype(str)
        .str.replace(r"^https?://", "", regex=True)
        .str.split("/")
        .str[0]
    )
    out: list[dict] = []
    seen: set[str] = set()
    for _, row in sub.sample(frac=1, random_state=42).iterrows():
        host = str(row["host"])
        if host in seen:
            continue
        seen.add(host)
        out.append(
            {
                "url": str(row["url"]),
                "label": status,
                "expected": "legitimate" if status == "legitimate" else "phishing",
            }
        )
        if len(out) >= n:
            break
    return out


def main() -> None:
    df = pd.read_csv(CSV, usecols=["url", "status", "length_url"])
    df = df[df["url"].astype(str).str.match(r"^https?://", na=False)]
    df = df[~df["url"].astype(str).str.contains(r"\s|%", regex=True)]
    df = df[df["length_url"].between(12, 90)]

    samples = pick(df, "legitimate", 6) + pick(df, "phishing", 6)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(samples, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(samples)} urls -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
