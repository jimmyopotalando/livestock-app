import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .models import db
from .routes import api_bp

load_dotenv()

# Absolute path to database folder
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_FOLDER = os.path.join(BASE_DIR, "database")
os.makedirs(DB_FOLDER, exist_ok=True)  # ensures folder exists

# Absolute path to SQLite DB with forward slashes (Windows-safe)
DB_PATH = os.path.join(DB_FOLDER, "livestock.db").replace("\\", "/")

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "default_secret_key")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")

    db.init_app(app)
    app.register_blueprint(api_bp, url_prefix="/api")

    # Create tables
    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
