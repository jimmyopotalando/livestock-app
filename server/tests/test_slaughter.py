# server/tests/test_slaughter.py
import pytest
from datetime import datetime
from server.models.slaughter_record import SlaughterRecord, db
from server.routes.slaughter_routes import slaughter_bp
from flask import Flask
from server.utils.payment_guard import PaymentGuard

# ---------- Pytest Fixtures ----------

@pytest.fixture
def app():
    """
    Create a Flask app with in-memory DB for testing slaughter routes.
    """
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.register_blueprint(slaughter_bp)
    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()


# ---------- SlaughterRecord Model Tests ----------

def test_create_slaughter_record(app):
    """
    Ensure a SlaughterRecord can be created and retrieved.
    """
    with app.app_context():
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

        retrieved = SlaughterRecord.query.filter_by(animal_id="ANIMAL123").first()
        assert retrieved is not None
        assert retrieved.owner_id == "OWNER1"
        assert retrieved.slaughtered_by == "ADMIN1"
        assert retrieved.reason == "Meat sale"
        assert retrieved.location == "Nairobi"

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

        db.session.delete(record1)
        db.session.delete(record2)
        db.session.commit()


# ---------- Slaughter Routes / Payment Enforcement Tests ----------

def test_slaughter_requires_payment(client, monkeypatch):
    """
    Ensure slaughter cannot be recorded if payment has not been made.
    """
    monkeypatch.setattr('server.utils.id_validator.animal_exists', lambda x: True)
    monkeypatch.setattr(PaymentGuard, 'has_paid', lambda a_id, action: False)

    payload = {"animal_id": "A100", "owner_id": "OWNER1"}
    resp = client.post('/slaughter/record', json=payload)
    data = resp.get_json()
    assert resp.status_code == 402
    assert "Payment not found" in data["message"]


def test_invalid_animal_id_rejected(client, monkeypatch):
    """
    Ensure slaughter record is rejected for invalid animal ID.
    """
    monkeypatch.setattr('server.utils.id_validator.animal_exists', lambda x: False)
    payload = {"animal_id": "BADID", "owner_id": "OWNER1"}
    resp = client.post('/slaughter/record', json=payload)
    data = resp.get_json()
    assert resp.status_code == 400
    assert "Invalid animal_id" in data["message"]


def test_slaughter_record_creation_with_payment(client, monkeypatch):
    """
    Ensure slaughter record is created when payment exists and animal ID is valid.
    """
    monkeypatch.setattr('server.utils.id_validator.animal_exists', lambda x: True)
    monkeypatch.setattr(PaymentGuard, 'has_paid', lambda a_id, action: True)

    payload = {
        "animal_id": "A101",
        "owner_id": "OWNER2",
        "reason": "Meat",
        "location": "Farm A"
    }
    resp = client.post('/slaughter/record', json=payload)
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["success"] is True
    assert SlaughterRecord.query.count() == 1


def test_sync_offline_records(client, monkeypatch):
    """
    Ensure batch sync creates multiple records atomically, skips invalid IDs or unpaid records.
    """
    monkeypatch.setattr('server.utils.id_validator.animal_exists', lambda x: x != "BADID")
    monkeypatch.setattr(PaymentGuard, 'has_paid', lambda a_id, action: a_id != "NOPAY")

    records_payload = [
        {"animal_id": "A201", "owner_id": "OWN1", "reason": "Meat", "location": "Farm X"},
        {"animal_id": "BADID", "owner_id": "OWN2", "reason": "Meat", "location": "Farm Y"},
        {"animal_id": "NOPAY", "owner_id": "OWN3", "reason": "Meat", "location": "Farm Z"},
    ]
    resp = client.post('/slaughter/sync_offline', json=records_payload)
    data = resp.get_json()

    assert resp.status_code == 200
    assert data["success"] is True
    # Only valid & paid record should be synced
    assert len(data["synced"]) == 1
    assert data["synced"][0]["animal_id"] == "A201"
    assert len(data["failed"]) == 2
