import os
from dotenv import load_dotenv

load_dotenv()

# Absolute path to project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_default_secret_key')
    DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'

    # SQLite absolute path
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(PROJECT_ROOT, 'database', 'livestock.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Upload folder absolute path
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(PROJECT_ROOT, 'uploads'))
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
