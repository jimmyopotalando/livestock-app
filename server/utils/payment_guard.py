import hmac
import hashlib
import json
from datetime import datetime

from server.models.payment import db, Payment
from server.utils.logger import logger  # ✅ Logger preserved


class PaymentGuard:
    """
    Ensures Mpesa payment callbacks are valid and safely recorded.
    Also logs payment verification and recording for monitoring.
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
            if not isinstance(data, dict):
                logger.error("Payment callback validation failed: data is not a dict.")
                return False

            if not secret_key:
                logger.error("Payment callback validation failed: missing secret key.")
                return False

            received_signature = data.get("signature")
            if not received_signature:
                logger.warning("Payment callback missing signature.")
                return False

            body = data.get("Body", {})
            if not isinstance(body, dict):
                logger.warning("Payment callback Body is not a dict.")
                return False

            payload_str = json.dumps(
                body,
                separators=(',', ':'),
                sort_keys=True
            )

            computed_signature = hmac.new(
                secret_key.encode("utf-8"),
                payload_str.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()

            valid = hmac.compare_digest(received_signature, computed_signature)

            if valid:
                logger.info("Payment callback signature validated successfully.")
            else:
                logger.warning("Payment callback signature validation FAILED.")

            return valid

        except Exception as e:
            logger.error(f"Error validating payment callback: {str(e)}", exc_info=True)
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
        if not isinstance(payment_data, dict):
            logger.error("Payment recording failed: payment_data is not a dict.")
            raise ValueError("Invalid payment data")

        checkout_id = payment_data.get("checkout_request_id")
        if not checkout_id:
            logger.error("Payment recording failed: Missing CheckoutRequestID")
            raise ValueError("Missing CheckoutRequestID")

        # Check for duplicate payment
        existing = Payment.query.filter_by(
            checkout_request_id=checkout_id
        ).first()

        if existing:
            logger.info(
                f"Duplicate payment detected: checkout_request_id={checkout_id}, ignoring insert."
            )
            return existing  # Already recorded

        # Normalize transaction date
        transaction_date = payment_data.get("transaction_date")
        if not isinstance(transaction_date, datetime):
            transaction_date = datetime.utcnow()

        try:
            amount = float(payment_data.get("amount", 0))
        except (TypeError, ValueError):
            logger.error(
                f"Invalid payment amount for checkout_request_id={checkout_id}"
            )
            raise ValueError("Invalid payment amount")

        payment = Payment(
            checkout_request_id=checkout_id,
            phone_number=payment_data.get("phone_number"),
            amount=amount,
            result_code=payment_data.get("result_code"),
            result_desc=payment_data.get("result_desc"),
            transaction_date=transaction_date,
            synced=True
        )

        try:
            db.session.add(payment)
            db.session.commit()

            logger.info(
                "Payment recorded successfully: "
                f"checkout_request_id={checkout_id}, "
                f"amount={payment.amount}, "
                f"phone={payment.phone_number}"
            )

            return payment

        except Exception as e:
            db.session.rollback()
            logger.error(
                f"Failed to record payment: checkout_request_id={checkout_id}, error={str(e)}",
                exc_info=True
            )
            raise

    @staticmethod
    def is_successful(payment_data):
        """
        Returns True if payment result_code indicates success.
        Mpesa success is result_code == "0".
        """
        result_code = payment_data.get("result_code")
        success = str(result_code) == "0"

        if success:
            logger.info(
                f"Payment success detected: checkout_request_id={payment_data.get('checkout_request_id')}"
            )
        else:
            logger.warning(
                f"Payment failed: checkout_request_id={payment_data.get('checkout_request_id')}, "
                f"result_code={result_code}"
            )

        return success

    @staticmethod
    def has_paid(animal_id, action_type):
        """
        Checks if a successful payment exists for a given animal and action type.

        action_type: 'ownership' or 'slaughter' (matches frontend usage)

        Returns True if payment exists and was successful.
        """
        payment = Payment.query.filter_by(
            animal_id=animal_id,
            action_type=action_type,
            status='success'
        ).first()

        if payment:
            logger.info(
                f"Payment verified for animal_id={animal_id}, "
                f"action={action_type}, "
                f"transaction_id={payment.transaction_id}"
            )
            return True

        logger.warning(
            f"Payment NOT found for animal_id={animal_id}, action={action_type}"
        )
        return False

