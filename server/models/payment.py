# server/models/payment.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    animal_id = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    payment_method = db.Column(db.String(20), nullable=False, default='Mpesa')
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, success, failed
    transaction_id = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    synced = db.Column(db.Boolean, default=False)  # Whether offline payment has been synced

    def to_dict(self):
        return {
            "id": self.id,
            "animal_id": self.animal_id,
            "amount": self.amount,
            "phone_number": self.phone_number,
            "payment_method": self.payment_method,
            "status": self.status,
            "transaction_id": self.transaction_id,
            "timestamp": self.timestamp.isoformat(),
            "synced": self.synced,
        }

    def mark_success(self, transaction_id: str):
        self.status = 'success'
        self.transaction_id = transaction_id
        db.session.commit()

    def mark_failed(self, transaction_id: str = None):
        self.status = 'failed'
        if transaction_id:
            self.transaction_id = transaction_id
        db.session.commit()
