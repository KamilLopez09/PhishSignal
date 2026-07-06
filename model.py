''' Import libraries '''

# Import pandas: This is used to load and organize the dataset
import pandas as pd

# Import numpy: This is used to perform mathematical operations on arrays
import numpy as np

# Import re: This is used to extract patterns from URLs
import re

# Import scikit-learn: This is used to train and evaluate the model
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
from sklearn.ensemble import RandomForestClassifier

# Import pickle: This is used to save and load the trained model
import pickle

# Import whois and datetime: These are used to get domain registration info
import whois
import datetime
import logging
import threading

# Suppress whois error messages
logging.getLogger("whois").setLevel(logging.CRITICAL)


''' Load Dataset '''

# Load the dataset from the CSV file
df = pd.read_csv("apidataset.csv")

# Print the shape of the dataset
print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")


''' Feature Selection '''

# Convert status to binary (0 is legit and 1 is phishing)
df['status'] = df['status'].map({'phishing': 1, 'legitimate': 0})

# Select only numerical columns so we can run correlation math on them
numericalDf = df.select_dtypes(include=['float64', 'int64'])

'''
Compute the correlation matrix.
This measures how strongly each feature relates to the label (phishing or not).
A score close to 1 or -1 means that feature is a strong predictor of phishing.
A score close to 0 means that feature is basically useless for detection.
Mahdi and Rayyan prolly remember this from Lin or Michel's class lol
btw thanks to a bunch of linear algebra courses or videos online for this I never
expected a crossover of linear algebra and prob & stats lmao
'''
corrMatrix = numericalDf.corr()['status']

# featureSelector: This function keeps only the features that are strongly
# correlated with the label, anything above the threshold gets included
def featureSelector(cmatrix, threshold):
    selectedFeatures = []
    for feature, score in cmatrix.items():
        if abs(score) > threshold and feature != 'status':
            selectedFeatures.append(feature)
    return selectedFeatures

# Use 0.1 as the threshold meaning any feature correlated above 10% gets included
selectedFeatures = featureSelector(corrMatrix, 0.1)
print(f"Selected {len(selectedFeatures)} features")


''' Prepare Data '''

# Separate features (inputs) and labels (what we are predicting)
X = df[selectedFeatures]
y = df['status']

'''
Split into training and testing sets.
The model learns from the training set and gets evaluated on the test set.
This way we can measure how well it performs on data it has never seen before.
'''
xTrain, xTest, yTrain, yTest = train_test_split(X, y, test_size=0.25, random_state=42)

'''
StandardScaler normalizes all features to the same numeric range.
This prevents features with large numbers from dominating the model.
For example, URL length (100+) would otherwise overpower a binary flag (0 or 1).
Think of it like converting miles and kilometers to the same unit before comparing.
'''
scaler = StandardScaler()
xTrainScaled = scaler.fit_transform(xTrain)
xTestScaled = scaler.transform(xTest)

print(f"Training samples: {len(xTrain)} | Testing samples: {len(xTest)}")


''' Train Model '''

'''
Random Forest works by building many decision trees and having them vote
on whether a URL is phishing or not. The majority vote wins.
n_estimators is the number of trees, more trees means more accurate but slower.
n_jobs=-1 tells it to use all available CPU cores to speed up training.
random_state=42 makes the results reproducible every time we run it.
'''
print("\nTraining Random Forest...")
model = RandomForestClassifier(n_estimators=200, max_depth=None, random_state=42, n_jobs=-1)
model.fit(xTrainScaled, yTrain)

# Run predictions on the test set to measure real world accuracy
yPred = model.predict(xTestScaled)
accuracy = accuracy_score(yTest, yPred)
print(f"Done! Accuracy: {round(accuracy * 100, 2)}%")


''' Save Model '''

# Save the model, scaler, and selected features to disk so the API can load them
pickle.dump({"model": model, "scaler": scaler, "features": selectedFeatures}, open("model.pkl", "wb"))
print("Model saved as model.pkl")


''' Feature Extraction '''

# Load the saved model back from disk
saved = pickle.load(open("model.pkl", "rb"))
model = saved["model"]
scaler = saved["scaler"]
selectedFeatures = saved["features"]

# Cache for domain age lookups so we never look up the same domain twice
domainCache = {}

# getDomainAge: This function fetches the age of a domain in days using WHOIS
def getDomainAge(cleanDomain):

    # Check cache first so we dont repeat slow network calls
    if cleanDomain in domainCache:
        return domainCache[cleanDomain]

    # Run WHOIS in a separate thread so we can enforce a hard timeout. this checks for the age
    result = {"age": -1}

    def doWhois():
        try:
            import io, sys
            sys.stderr = io.StringIO()
            domainInfo = whois.whois(cleanDomain)
            sys.stderr = sys.__stderr__
            creationDate = domainInfo.creation_date

            # Sometimes WHOIS returns a list of dates, we take the first one
            if isinstance(creationDate, list):
                creationDate = creationDate[0]

            # Calculate how many days old the domain is
            if creationDate:
                result["age"] = (datetime.datetime.now() - creationDate.replace(tzinfo=None)).days
        except:
            sys.stderr = sys.__stderr__

    # Start the WHOIS thread and wait a max of 3 seconds before giving up
    t = threading.Thread(target=doWhois)
    t.start()
    t.join(timeout=3)

    # Save to cache only if the lookup actually succeeded
    if result["age"] > 0:
        domainCache[cleanDomain] = result["age"]

    return result["age"]


# extractFeatures: This function extracts all measurable signals from a raw URL
def extractFeatures(url):
    features = {}
    signals = []

    # Extract the hostname from the URL (e.g. "paypal.com" from "https://paypal.com/login")
    try:
        hostname = url.split("//")[1].split("/")[0]
    except:
        hostname = ""

    # Extract the path from the URL (e.g. "/login/verify" from "https://paypal.com/login/verify")
    try:
        path = url.split("//")[1].split("/", 1)[1] if "/" in url.split("//")[1] else ""
    except:
        path = ""

    # Split the URL into individual words for length analysis
    wordsRaw = [w for w in re.split(r"[\W_]+", url) if w]
    wordsHost = [w for w in re.split(r"[\W_]+", hostname) if w]
    wordsPath = [w for w in re.split(r"[\W_]+", path) if w]


    ''' URL Structure Features '''

    # Length of the full URL, phishing URLs tend to be very long
    features["length_url"] = len(url)

    # Length of the hostname
    features["length_hostname"] = len(hostname)

    # Check if the hostname is a raw IP address like 192.168.1.1
    # Legitimate websites always use domain names, never raw IPs (think its pretty obvious)
    hasIP = bool(re.match(r"^\d+\.\d+\.\d+\.\d+$", hostname))
    features["ip"] = int(hasIP)
    if hasIP:
        signals.append("Domain is a raw IP address, legitimate websites never do this")

    # Count special characters that are common in phishing URLs
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

    # Check if the URL uses HTTPS (encrypted) or plain HTTP (unencrypted)
    usesHTTPS = url.startswith("https")
    features["https_token"] = int(usesHTTPS)
    if not usesHTTPS:
        signals.append("Uses unencrypted HTTP with no SSL protection")

    '''
    Ratio of digits in the URL and hostname.
    A high ratio of digits often indicates a very oddd domain
    We divide the digit count by the total length to get a value between 0 and 1. (again correlation)
    '''
    features["ratio_digits_url"] = round(sum(c.isdigit() for c in url) / max(len(url), 1), 4)
    features["ratio_digits_host"] = round(sum(c.isdigit() for c in hostname) / max(len(hostname), 1), 4)


    ''' Subdomain Features '''

    # Count how many subdomains the URL has
    # Phishing sites often use many subdomains to look legitimate
    # e.g. "login.secure.paypal.evil.com" has 3 subdomains
    parts = hostname.split(".")
    features["nb_subdomains"] = max(len(parts) - 2, 0)
    features["tld_in_subdomain"] = 1 if len(parts) > 2 else 0
    features["abnormal_subdomain"] = 1 if re.search(r"^(w[0-9]|www[0-9])", hostname) else 0

    # Check if the hostname has a hyphen, common in fake domains like "paypal-secure.com" <-- this is something mufassi would make boii
    hasDash = "-" in hostname
    features["prefix_suffix"] = int(hasDash)
    if hasDash:
        signals.append("Hostname contains hyphens, common in fake domains like paypal-secure.com")

    # Check if the URL uses a shortening service that hides the real destination
    isShortened = bool(re.search(r"bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly", url))
    features["shortening_service"] = int(isShortened)
    if isShortened:
        signals.append("Uses a URL shortener, the real destination is hidden")


    ''' Word Length Features '''

    '''
    These features measure the length and structure of words in the URL.
    Phishing URLs often have very long or random-looking words in the hostname
    because they try to include a legitimate brand name alongside a fake domain.
    For example "paypal-secure-login-verify.xyz" is very long compared to "paypal.com".
    '''
    features["length_words_raw"] = len(wordsRaw)
    features["shortest_word_host"] = min((len(w) for w in wordsHost), default=0)
    features["longest_words_raw"] = max((len(w) for w in wordsRaw), default=0)
    features["longest_word_host"] = max((len(w) for w in wordsHost), default=0)
    features["longest_word_path"] = max((len(w) for w in wordsPath), default=0)
    features["avg_words_raw"] = round(sum(len(w) for w in wordsRaw) / max(len(wordsRaw), 1), 4)
    features["avg_word_host"] = round(sum(len(w) for w in wordsHost) / max(len(wordsHost), 1), 4)
    features["avg_word_path"] = round(sum(len(w) for w in wordsPath) / max(len(wordsPath), 1), 4)


    ''' Phishing Keyword Features '''

    # Check if the URL contains common phishing keywords in the path
    hasPhishHints = bool(re.search(r"login|verify|secure|account|update|confirm|banking|payment", url.lower()))
    features["phish_hints"] = int(hasPhishHints)
    if hasPhishHints:
        signals.append("URL contains phishing keywords like login, verify, or secure")

    # Check if the URL uses a suspicious top-level domain
    hasSuspiciousTLD = bool(re.search(r"\.xyz|\.top|\.club|\.online|\.site|\.ru|\.cn", url.lower()))
    features["suspecious_tld"] = int(hasSuspiciousTLD)
    if hasSuspiciousTLD:
        signals.append("Uses a suspicious top-level domain like .xyz, .top, or .ru")


    ''' Domain Age via WHOIS '''

    # Look up when the domain was registered
    # Phishing sites are almost always brand new, legitimate sites are usually years old
    cleanDomain = hostname.replace("www.", "")
    domainAge = getDomainAge(cleanDomain)
    features["domain_age"] = domainAge
    features["dns_record"] = 1 if domainAge > 0 else 0

    if domainAge == -1:
        signals.append("Domain has no WHOIS record, it may not exist or was just created")
    elif domainAge < 30:
        signals.append(f"Domain is only {domainAge} days old, phishing sites are almost always newly registered")
    elif domainAge < 180:
        signals.append(f"Domain is relatively new at {domainAge} days old")


    ''' Default Page-Level Features '''

    '''
    These features normally require fetching and scanning the actual webpage.
    Since we are analyzing URLs only, we set them to neutral default values.
    They will be replaced with real values in a future version using web scraping.
    '''
    features["statistical_report"] = 0
    features["nb_hyperlinks"] = 10
    features["ratio_intHyperlinks"] = 0.5
    features["ratio_extRedirection"] = 0
    features["external_favicon"] = 0
    features["links_in_tags"] = 0.5
    features["ratio_intMedia"] = 0.5
    features["ratio_extMedia"] = 0.1
    features["safe_anchor"] = 0.5
    features["empty_title"] = 0
    features["domain_in_title"] = 1
    features["domain_with_copyright"] = 1
    features["domain_registration_length"] = 365
    features["google_index"] = 1
    features["page_rank"] = 4

    return features, signals


# analyze: This function runs the full analysis pipeline on a given URL
def analyze(url):

    # Extract features and human readable signals from the URL
    features, signals = extractFeatures(url)

    '''
    Build the feature vector in the exact same column order as training.
    The model expects inputs in a specific order, like filling out a form,
    every field has to be in the right place or the prediction will be wrong.
    We wrap it in a DataFrame so the scaler recognizes the column names.
    '''
    vector = pd.DataFrame(
        [features.get(col, 0) for col in selectedFeatures],
        index=selectedFeatures
    ).T

    # Scale the vector using the same scaler that was used during training
    vector = scaler.transform(vector)

    '''
    predict_proba returns two probabilities: [prob of safe, prob of phishing]
    We take index [1] which is the probability of it being phishing,
    then multiply by 100 to convert it to a 0 to 100 risk score.
    '''
    proba = model.predict_proba(vector)[0]
    score = int(round(proba[1] * 100))

    # If the model flagged it but no specific signals were triggered
    if not signals and score >= 50:
        signals.append("Uncertain regarding phishing: no signals detected.")

    # If everything looks clean
    if not signals:
        signals.append("No phishing signals detected")

    # Return the score and signals, the frontend decides how to label it
    return {
        "url": url,
        "score": score,
        "signals": signals
    }

''' Start Server '''

# Import uvicorn: This is used to run the FastAPI server
import uvicorn

# Import FastAPI and CORSMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the FastAPI app
app = FastAPI()

'''
CORSMiddleware allows the website to talk to the API.
Without it the browser blocks the request for security reasons
because the website and API are on different domains.
'''
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


''' Routes '''

# /analyze: This route takes a URL and returns a score and signals <-- barely know wtf im doing
@app.get("/analyze")
def analyzeURL(url: str):

    # Run the full analysis pipeline on the given URL
    result = analyze(url)

    # Return the result as JSON, FastAPI handles the conversion automatically
    return result

# /health: This route is used by Railway to check if the server is running
@app.get("/health")
def health():
    return {"status": "ok"}


# Run the server on port 8080 which is what Railway expects (so many issues with this bro wtf)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
