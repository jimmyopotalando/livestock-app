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
