# server/tests/test_slaughter.py
import pytest
from datetime import datetime
from server.models.slaughter_record import SlaughterRecord, db

# ---------- SlaughterRecord Model Tests ----------

def test_create_slaughter_record(app):
    """
    Ensure a SlaughterRecord can be created and retrieved.
    """
    with app.app_context():
        # Create a test slaughter record
        record = SlaughterRecord(
            animal_id="ANIMAL123",
            owner_id="OWNER1",
            slaughtered_by="ADMIN1",
            slaughter_date=datetime.utcnow(),
            reason="Meat sale",
            location="Nairobi"
        )
        db.session.add(record)
        db.session.commit()

        # Retrieve the record
        retrieved = SlaughterRecord.query.filter_by(animal_id="ANIMAL123").first()
        assert retrieved is not None
        assert retrieved.owner_id == "OWNER1"
        assert retrieved.slaughtered_by == "ADMIN1"
        assert retrieved.reason == "Meat sale"
        assert retrieved.location == "Nairobi"

        # Cleanup
        db.session.delete(retrieved)
        db.session.commit()


def test_multiple_slaughter_records(app):
    """
    Ensure multiple slaughter records can be tracked.
    """
    with app.app_context():
        record1 = SlaughterRecord(
            animal_id="ANIMALMULTI1",
            owner_id="OWNERA",
            slaughtered_by="ADMIN1",
            slaughter_date=datetime.utcnow(),
            reason="Meat sale",
            location="Mombasa"
        )
        record2 = SlaughterRecord(
            animal_id="ANIMALMULTI2",
            owner_id="OWNERB",
            slaughtered_by="ADMIN2",
            slaughter_date=datetime.utcnow(),
            reason="Disease control",
            location="Nakuru"
        )

        db.session.add(record1)
        db.session.add(record2)
        db.session.commit()

        records = SlaughterRecord.query.all()
        assert any(r.animal_id == "ANIMALMULTI1" for r in records)
        assert any(r.animal_id == "ANIMALMULTI2" for r in records)

        # Cleanup
        db.session.delete(record1)
        db.session.delete(record2)
        db.session.commit()
