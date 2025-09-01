import os
from dotenv import load_dotenv

# Load .env file variables
load_dotenv()

class Config:
    # General Config
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_default_secret_key')
    DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///../database/livestock.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Uploads
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

    # Any other configs can be added here
