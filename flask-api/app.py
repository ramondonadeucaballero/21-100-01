from flask import Flask
import json
app = Flask(__name__)

@app.route('/config')
def index():
    file = open("ESDconfigstored.txt","r")
    config=(file.read())
    return json.dumps(config.split("\n"))