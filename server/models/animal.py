# animal.py

from . import db
from datetime import datetime

class Owner(db.Model):
    __tablename__ = 'owners'

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.String(50), unique=True, nullable=False)  # e.g., O-NE7890
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    location = db.Column(db.String(100), nullable=False)

    animals = db.relationship('Animal', backref='owner', lazy=True)

    def __repr__(self):
        return f"<Owner {self.owner_id} - {self.name}>"


class Animal(db.Model):
    __tablename__ = 'animals'

    id = db.Column(db.Integer, primary_key=True)
    animal_id = db.Column(db.String(50), unique=True, nullable=False)  # e.g., A-NE34567
    owner_id = db.Column(db.Integer, db.ForeignKey('owners.id'), nullable=False)

    # Store image file paths
    image_front = db.Column(db.String(255), nullable=False)
    image_back = db.Column(db.String(255), nullable=False)
    image_left = db.Column(db.String(255), nullable=False)
    image_right = db.Column(db.String(255), nullable=False)

    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Animal {self.animal_id} owned by {self.owner_id}>"
