# server/tests/test_ownership.py
import pytest
from datetime import datetime
from flask import Flask
from server.models.ownership_history import OwnershipHistory, db
from server.routes.ownership_routes import ownership_bp
from server.utils.payment_guard import PaymentGuard

# ---------- Pytest Fixtures ----------

@pytest.fixture
def app():
    """
    Create a Flask app with in-memory DB for testing ownership routes.
    """
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.register_blueprint(ownership_bp)
    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()


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


# ---------- Ownership Routes / Payment Enforcement Tests ----------

def test_ownership_change_requires_payment(client, monkeypatch):
    """
    Ensure ownership change is blocked if payment has not been made.
    """
    monkeypatch.setattr('server.utils.id_validator.animal_exists', lambda x: True)
    monkeypatch.setattr(PaymentGuard, 'has_paid', lambda a_id, action: False)

    payload = {
        "animal_id": "ANIMALNOPAY",
        "previous_owner_id": "OWNER1",
        "new_owner_id": "OWNER2"
    }

    resp = client.post('/ownership/change', json=payload)
    data = resp.get_json()

    assert resp.status_code == 402
    assert "Payment not found" in data["message"]


def test_invalid_animal_id_rejected(client, monkeypatch):
    """
    Ensure ownership change is rejected for invalid animal ID.
    """
    monkeypatch.setattr('server.utils.id_validator.animal_exists', lambda x: False)

    payload = {
        "animal_id": "BADID",
        "previous_owner_id": "OWNER1",
        "new_owner_id": "OWNER2"
    }

    resp = client.post('/ownership/change', json=payload)
    data = resp.get_json()

    assert resp.status_code == 400
    assert "Invalid animal_id" in data["message"]


def test_ownership_change_with_valid_payment(client, monkeypatch):
    """
    Ensure ownership change succeeds when payment exists and animal ID is valid.
    """
    monkeypatch.setattr('server.utils.id_validator.animal_exists', lambda x: True)
    monkeypatch.setattr(PaymentGuard, 'has_paid', lambda a_id, action: True)

    payload = {
        "animal_id": "ANIMALOK",
        "previous_owner_id": "OWNER1",
        "new_owner_id": "OWNER2",
        "reason": "Sold"
    }

    resp = client.post('/ownership/change', json=payload)
    data = resp.get_json()

    assert resp.status_code == 200
    assert data["success"] is True
    assert OwnershipHistory.query.count() == 1


def test_sync_offline_ownership_changes(client, monkeypatch):
    """
    Ensure offline ownership sync:
    - Syncs valid + paid changes
    - Skips invalid animal IDs
    - Skips unpaid changes
    """
    monkeypatch.setattr('server.utils.id_validator.animal_exists', lambda x: x != "BADID")
    monkeypatch.setattr(PaymentGuard, 'has_paid', lambda a_id, action: a_id != "NOPAY")

    changes_payload = [
        {
            "animal_id": "ANIMAL1",
            "previous_owner_id": "A",
            "new_owner_id": "B",
            "reason": "Sale"
        },
        {
            "animal_id": "BADID",
            "previous_owner_id": "X",
            "new_owner_id": "Y",
            "reason": "Gift"
        },
        {
            "animal_id": "NOPAY",
            "previous_owner_id": "M",
            "new_owner_id": "N",
            "reason": "Sale"
        }
    ]

    resp = client.post('/ownership/sync_offline', json=changes_payload)
    data = resp.get_json()

    assert resp.status_code == 200
    assert data["success"] is True
    assert len(data["synced"]) == 1
    assert data["synced"][0]["animal_id"] == "ANIMAL1"
    assert len(data["failed"]) == 2
