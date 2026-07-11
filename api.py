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
        return {"status_code": resp.status_code, "body": resp.text[:800]}
    except Exception as e:
        return {"error": str(e)}