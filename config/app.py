from library import *
import os
import urllib.request
from flask import Flask, flash, request, redirect, url_for, render_template
from werkzeug.utils import secure_filename

app = Flask(__name__)


ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])

def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/predict/<filepath>')
def predict(filepath):
        return Currency_predict(filepath)


        
@app.route('/')
def upload_form():
	return "Currency predictor."

if __name__ == "__main__":
	app.run("0.0.0.0", 8080)

