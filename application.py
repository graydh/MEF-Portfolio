from parseCSV import portfolioDictionary
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
    return json.dumps(portfolioDictionary())

if __name__ == "__main__":
    app.run(debug=False, port=environ.get("PORT", 5000), host=environ.get('IP', '0.0.0.0'))

