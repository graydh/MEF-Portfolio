from src.parseXLSX import fetch
from flask import Flask, render_template
from os import environ
import json

app = Flask(__name__)

@app.route("/main")
@app.route("/")
def homepage():
    return render_template("index.html")

@app.route("/data")
def initialData():
    portfolio = fetch()
    d = json.dumps(portfolio, allow_nan=False)
    return d

if __name__ == "__main__":
    app.run(port=environ.get('PORT', 5000), host=environ.get('IP', '0.0.0.0'))
