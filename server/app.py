import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests (from React Native app)

# Configurations
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///../database/livestock.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')

# Initialize database
db = SQLAlchemy(app)

# Import and register API routes blueprint
from server.routes.api_routes import api_bp
app.register_blueprint(api_bp, url_prefix='/api')

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

# Root route for quick sanity check
@app.route('/')
def home():
    return "Welcome to the Livestock Registration & Verification API"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
