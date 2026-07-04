''' Import libraries '''

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