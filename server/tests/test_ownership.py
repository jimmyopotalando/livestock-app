# server/tests/test_ownership.py
import pytest
from datetime import datetime
from server.models.ownership_history import OwnershipHistory, db

# ---------- OwnershipHistory Model Tests ----------

def test_create_ownership_change(app):
    """
    Ensure OwnershipHistory model can record a change and retrieve it.
    """
    with app.app_context():
        # Create a test ownership change
        change = OwnershipHistory(
            animal_id="ANIMAL123",
            previous_owner_id="OWNER1",
            new_owner_id="OWNER2",
            changed_by="ADMIN1",
            change_date=datetime.utcnow(),
            reason="Sale"
        )
        db.session.add(change)
        db.session.commit()

        # Retrieve the record
        retrieved = OwnershipHistory.query.filter_by(animal_id="ANIMAL123").first()
        assert retrieved is not None
        assert retrieved.previous_owner_id == "OWNER1"
        assert retrieved.new_owner_id == "OWNER2"
        assert retrieved.reason == "Sale"

        # Cleanup
        db.session.delete(retrieved)
        db.session.commit()


def test_multiple_changes(app):
    """
    Ensure multiple ownership changes are recorded correctly.
    """
    with app.app_context():
        change1 = OwnershipHistory(
            animal_id="ANIMALMULTI",
            previous_owner_id="OWNERA",
            new_owner_id="OWNERB",
            changed_by="ADMIN1",
            change_date=datetime.utcnow(),
            reason="Gift"
        )
        change2 = OwnershipHistory(
            animal_id="ANIMALMULTI",
            previous_owner_id="OWNERB",
            new_owner_id="OWNERC",
            changed_by="ADMIN2",
            change_date=datetime.utcnow(),
            reason="Sale"
        )

        db.session.add(change1)
        db.session.add(change2)
        db.session.commit()

        records = OwnershipHistory.query.filter_by(animal_id="ANIMALMULTI").all()
        assert len(records) == 2
        assert records[0].previous_owner_id == "OWNERA"
        assert records[1].new_owner_id == "OWNERC"

        # Cleanup
        for r in records:
            db.session.delete(r)
        db.session.commit()
