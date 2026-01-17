# server/tests/test_payments.py
import pytest
from server.utils.mpesa_client import MpesaClient
from server.utils.payment_guard import PaymentGuard
from server.models.payment import Payment, db
from datetime import datetime

# ---------- Model Tests ----------

def test_create_payment(app):
    """
    Ensure Payment model can be created and saved.
    """
    with app.app_context():
        payment = Payment(
            checkout_request_id="TEST12345",
            phone_number="254712345678",
            amount=100,
            result_code="0",
            result_desc="Success",
            transaction_date=datetime.utcnow(),
            synced=True
        )
        db.session.add(payment)
        db.session.commit()

        retrieved = Payment.query.filter_by(checkout_request_id="TEST12345").first()
        assert retrieved is not None
        assert retrieved.amount == 100
        assert retrieved.result_code == "0"

        # Cleanup
        db.session.delete(retrieved)
        db.session.commit()


# ---------- Mpesa Client Tests ----------

@pytest.mark.skip(reason="Requires live/sandbox credentials")
def test_stk_push():
    """
    Test STK push request (sandbox recommended)
    """
    client = MpesaClient()
    phone = "254712345678"
    amount = 1  # minimal amount for sandbox
    response = client.stk_push(amount, phone, account_reference="TEST", transaction_desc="UnitTest")
    
    assert "CheckoutRequestID" in response
    assert response["ResponseCode"] == "0"


@pytest.mark.skip(reason="Requires valid checkout_request_id from Mpesa")
def test_check_transaction_status():
    """
    Test querying a transaction status
    """
    client = MpesaClient()
    checkout_id = "ws_CO_123456789"  # Replace with a valid ID in sandbox
    response = client.check_transaction_status(checkout_id)
    
    assert "ResponseCode" in response


# ---------- Payment Guard Tests ----------

def test_payment_guard_record_and_success(app):
    """
    Test PaymentGuard records a payment and checks success
    """
    with app.app_context():
        payment_data = {
            "checkout_request_id": "GUARDTEST123",
            "phone_number": "254712345678",
            "amount": 50,
            "result_code": "0",
            "result_desc": "Success",
            "transaction_date": datetime.utcnow()
        }

        # Record payment
        payment = PaymentGuard.record_payment(payment_data)
        assert payment.checkout_request_id == "GUARDTEST123"
        assert PaymentGuard.is_successful(payment_data) is True

        # Duplicate record should return the same object
        duplicate = PaymentGuard.record_payment(payment_data)
        assert duplicate.id == payment.id

        # Cleanup
        db.session.delete(payment)
        db.session.commit()


# ---------- Payment Verification by Action Tests ----------

def test_has_paid_success_for_action(app):
    """
    Ensure has_paid returns True for valid successful payment.
    """
    with app.app_context():
        payment = Payment(
            animal_id="ANIMALPAY1",
            action_type="slaughter",
            amount=200,
            phone_number="254700000000",
            status="success",
            timestamp=datetime.utcnow(),
            synced=True
        )
        db.session.add(payment)
        db.session.commit()

        assert PaymentGuard.has_paid("ANIMALPAY1", "slaughter") is True

        db.session.delete(payment)
        db.session.commit()


def test_has_paid_fails_for_wrong_action(app):
    """
    Ensure has_paid fails if action_type does not match.
    """
    with app.app_context():
        payment = Payment(
            animal_id="ANIMALPAY2",
            action_type="ownership",
            amount=300,
            phone_number="254711111111",
            status="success",
            timestamp=datetime.utcnow(),
            synced=True
        )
        db.session.add(payment)
        db.session.commit()

        assert PaymentGuard.has_paid("ANIMALPAY2", "slaughter") is False

        db.session.delete(payment)
        db.session.commit()


def test_has_paid_fails_for_unsuccessful_payment(app):
    """
    Ensure failed or pending payments are rejected.
    """
    with app.app_context():
        payment = Payment(
            animal_id="ANIMALPAY3",
            action_type="slaughter",
            amount=150,
            phone_number="254722222222",
            status="failed",
            timestamp=datetime.utcnow(),
            synced=True
        )
        db.session.add(payment)
        db.session.commit()

        assert PaymentGuard.has_paid("ANIMALPAY3", "slaughter") is False

        db.session.delete(payment)
        db.session.commit()


# ---------- Offline / Duplicate Safety Tests ----------

def test_duplicate_checkout_request_id_prevented(app):
    """
    Ensure duplicate checkout_request_id is not recorded twice.
    """
    with app.app_context():
        data = {
            "checkout_request_id": "DUPLICATE123",
            "phone_number": "254733333333",
            "amount": 75,
            "result_code": "0",
            "result_desc": "Success"
        }

        first = PaymentGuard.record_payment(data)
        second = PaymentGuard.record_payment(data)

        assert first.id == second.id

        db.session.delete(first)
        db.session.commit()
