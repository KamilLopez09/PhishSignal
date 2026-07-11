''' Import libraries '''

# Import requests: This is used to make HTTP requests to external APIs
import requests

# Import FastAPI: This is used to create the API server
from fastapi import FastAPI

'''Import CORSMiddleware: This allows the website to talk to the API
# without it the browser would block the request for security reasons'''
from fastapi.middleware.cors import CORSMiddleware

# Import the analyze function from our model
from model import analyze


''' Initialize App '''

# Create the FastAPI app
app = FastAPI()

# Allow all origins so any website can call this API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


''' Routes '''

# /analyze: This route takes a URL and returns a score and signals
@app.get("/analyze")
def analyzeURL(url: str):

    # Run the analysis on the given URL
    result = analyze(url)

    # Return the result as JSON
    return result

# /health: This route is used by Railway to check if the server is running
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/debug-rdap")
def debug_rdap():
    try:
        resp = requests.get("https://rdap.org/domain/protonmail.com", timeout=5)
        data = resp.json()
        return {"status_code": resp.status_code, "events": data.get("events")}
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/debug-age")
def debug_age():
    from model import getDomainAge
    return {"age": getDomainAge("protonmail.com")}

@app.get("/debug-features")
def debug_features(url: str):
    from model import extractFeatures  # adjust name if it's called something else in model.py
    return extractFeatures(url)

@app.get("/debug-google")
def debug_google():
    from model import checkGoogleIndex  # use whatever the real function name is
    return {"result": checkGoogleIndex("protonmail.com")}