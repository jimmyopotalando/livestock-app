# server/routes/__init__.py

from flask import Blueprint

# Create a Blueprint named 'api'
api_bp = Blueprint('api', __name__)

# Import the route definitions so they are registered with the blueprint
from . import api_routes
