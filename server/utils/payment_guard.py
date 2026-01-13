# server/utils/payment_guard.py
import hmac
import hashlib
import json
from server.models.payment import db, Payment
from datetime import datetime

class PaymentGuard:
    """
    Ensures Mpesa payment callbacks are valid and safely recorded.
    """

    @staticmethod
    def validate_callback(data, secret_key):
        """
        Optional: Validate callback integrity using HMAC signature.
        Some Mpesa setups allow adding a signature for verification.
        data: dict
        secret_key: str
        Returns True if valid, False otherwise.
        """
        try:
            received_signature = data.get("signature")
            if not received_signature:
                return False

            payload_str = json.dumps(data.get("Body", {}), separators=(',', ':'), sort_keys=True)
            computed_signature = hmac.new(
                secret_key.encode(),
                payload_str.encode(),
                hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(received_signature, computed_signature)
        except Exception:
            return False

    @staticmethod
    def record_payment(payment_data):
        """
        Records a payment safely, avoiding duplicates.
        payment_data: dict with keys:
            - checkout_request_id
            - phone_number
            - amount
            - transaction_date (optional)
            - result_code
            - result_desc
        Returns: Payment object or raises Exception
        """
        checkout_id = payment_data.get("checkout_request_id")
        if not checkout_id:
            raise ValueError("Missing CheckoutRequestID")

        # Check for duplicate
        existing = Payment.query.filter_by(checkout_request_id=checkout_id).first()
        if existing:
            return existing  # already recorded

        transaction_date = payment_data.get("transaction_date") or datetime.utcnow()

        payment = Payment(
            checkout_request_id=checkout_id,
            phone_number=payment_data.get("phone_number"),
            amount=payment_data.get("amount"),
            result_code=payment_data.get("result_code"),
            result_desc=payment_data.get("result_desc"),
            transaction_date=transaction_date,
            synced=True
        )

        db.session.add(payment)
        db.session.commit()

        return payment

    @staticmethod
    def is_successful(payment_data):
        """
        Returns True if payment result_code indicates success
        """
        return str(payment_data.get("result_code")) == "0"
