# server/models/ownership_history.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class OwnershipHistory(db.Model):
    __tablename__ = 'ownership_history'

    id = db.Column(db.Integer, primary_key=True)
    animal_id = db.Column(db.String(50), nullable=False)
    previous_owner_id = db.Column(db.String(50), nullable=False)
    previous_owner_name = db.Column(db.String(100), nullable=False)
    previous_owner_phone = db.Column(db.String(20), nullable=False)
    new_owner_id = db.Column(db.String(50), nullable=False)
    new_owner_name = db.Column(db.String(100), nullable=False)
    new_owner_phone = db.Column(db.String(20), nullable=False)
    changed_by = db.Column(db.String(50), nullable=True)  # Admin or system user ID
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)  # Optional description or reason

    def to_dict(self):
        return {
            "id": self.id,
            "animal_id": self.animal_id,
            "previous_owner_id": self.previous_owner_id,
            "previous_owner_name": self.previous_owner_name,
            "previous_owner_phone": self.previous_owner_phone,
            "new_owner_id": self.new_owner_id,
            "new_owner_name": self.new_owner_name,
            "new_owner_phone": self.new_owner_phone,
            "changed_by": self.changed_by,
            "timestamp": self.timestamp.isoformat(),
            "notes": self.notes,
        }

    @classmethod
    def record_change(cls, animal_id, previous_owner, new_owner, changed_by=None, notes=None):
        """
        Convenience method to create a new ownership history record.
        previous_owner and new_owner are dicts:
        { "id": str, "name": str, "phone": str }
        """
        entry = cls(
            animal_id=animal_id,
            previous_owner_id=previous_owner.get("id"),
            previous_owner_name=previous_owner.get("name"),
            previous_owner_phone=previous_owner.get("phone"),
            new_owner_id=new_owner.get("id"),
            new_owner_name=new_owner.get("name"),
            new_owner_phone=new_owner.get("phone"),
            changed_by=changed_by,
            notes=notes,
        )
        db.session.add(entry)
        db.session.commit()
        return entry
