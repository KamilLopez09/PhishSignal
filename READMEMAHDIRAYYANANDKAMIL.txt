yo 

i tried my best to make an api and apparently cpp, c, java, etc. all suck for machine learning and SOMEHOW python is the best??

anyways I had to go thru various tutorials n shit like a mix of logistic regression, scikitlearn, whois (to get the time and date of the website), and even an overlap of linear algebra and probability (that's pretty much machine learning wrapped up).

to properly run the api, you just need to:

1. pip install -r requirements.txt
2. Download apidataset.csv from Kaggle and put it in the folder
3. python model.py  (trains the model and saves model.pkl)
4. python -m uvicorn api:app --reload  (starts the API)   <--- this was a pain in the ass'

if you need any more info like how to load the APi and shit no worries. you can easily test it once you run step 4 by going to ur browser and typing this:

http://127.0.0.1:8000/analyze?url=YOURURLHERE

example:
http://127.0.0.1:8000/analyze?url=https://www.google.com


plsss contact me if u need anything 🙏🙏
