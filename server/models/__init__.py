# server/models/__init__.py

from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()

# Import models so they are registered with SQLAlchemy
from .animal import Animal, Owner
