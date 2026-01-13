# server/models/slaughter_record.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class SlaughterRecord(db.Model):
    __tablename__ = 'slaughter_records'

    id = db.Column(db.Integer, primary_key=True)
    animal_id = db.Column(db.String(50), nullable=False)
    authorized_by = db.Column(db.String(50), nullable=True)  # Admin or responsible user ID
    reason = db.Column(db.Text, nullable=True)  # Optional reason for slaughter
    location = db.Column(db.String(255), nullable=True)  # Slaughter location
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    synced = db.Column(db.Boolean, default=False)  # For offline records

    def to_dict(self):
        return {
            "id": self.id,
            "animal_id": self.animal_id,
            "authorized_by": self.authorized_by,
            "reason": self.reason,
            "location": self.location,
            "timestamp": self.timestamp.isoformat(),
            "synced": self.synced,
        }

    @classmethod
    def create_record(cls, animal_id, authorized_by=None, reason=None, location=None):
        """
        Convenience method to create a new slaughter record.
        """
        record = cls(
            animal_id=animal_id,
            authorized_by=authorized_by,
            reason=reason,
            location=location,
        )
        db.session.add(record)
        db.session.commit()
        return record

    def mark_synced(self):
        """
        Mark record as synced after offline submission is completed.
        """
        self.synced = True
        db.session.commit()
