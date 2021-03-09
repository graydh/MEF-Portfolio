from parseCSV import portfolioDictionary
from flask import Flask, render_template
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
    app.run(debug=True)

