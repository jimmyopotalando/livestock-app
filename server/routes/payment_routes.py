# server/routes/payment_routes.py
from flask import Blueprint, request, jsonify
from server.models.payment import db, Payment
from server.utils.mpesa_client import MpesaClient
from datetime import datetime

payment_bp = Blueprint('payment_bp', __name__, url_prefix='/payment')

# Initialize Mpesa client (assuming you have credentials in .env)
mpesa_client = MpesaClient()

@payment_bp.route('/process', methods=['POST'])
def process_payment():
    """
    Process a payment (online or offline).
    Expected payload:
    {
        "animal_id": "123ABC",
        "amount": 1000,
        "phone_number": "2547XXXXXXXX",
        "payment_method": "Mpesa"  # Optional, defaults to Mpesa
    }
    """
    data = request.get_json()

    animal_id = data.get('animal_id')
    amount = data.get('amount')
    phone_number = data.get('phone_number')
    payment_method = data.get('payment_method', 'Mpesa')
    offline = data.get('offline', False)  # if true, store for later syncing

    if not animal_id or not amount or not phone_number:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        # Create payment record in DB
        payment = Payment(
            animal_id=animal_id,
            amount=amount,
            phone_number=phone_number,
            payment_method=payment_method,
            status='pending',
            timestamp=datetime.utcnow(),
            synced=not offline,
        )
        db.session.add(payment)
        db.session.commit()

        # If offline, just return record, no Mpesa call
        if offline:
            return jsonify({"success": True, "payment": payment.to_dict(), "offline": True})

        # Online payment via Mpesa
        transaction_id = mpesa_client.stk_push(
            phone_number=phone_number,
            amount=amount,
            reference=f"ANIMAL-{animal_id}"
        )

        # Update payment status
        payment.transaction_id = transaction_id
        payment.status = 'success'
        db.session.commit()

        return jsonify({"success": True, "payment": payment.to_dict()})

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@payment_bp.route('/sync_offline', methods=['POST'])
def sync_offline_payments():
    """
    Endpoint to sync offline payments.
    Expects an array of payment objects:
    [
        { "animal_id": "...", "amount": ..., "phone_number": "...", "payment_method": "Mpesa" },
        ...
    ]
    """
    payments = request.get_json()
    if not payments or not isinstance(payments, list):
        return jsonify({"success": False, "message": "Invalid payload"}), 400

    synced = []
    failed = []

    for p in payments:
        try:
            payment = Payment(
                animal_id=p.get('animal_id'),
                amount=p.get('amount'),
                phone_number=p.get('phone_number'),
                payment_method=p.get('payment_method', 'Mpesa'),
                status='pending',
                timestamp=datetime.utcnow(),
                synced=False,
            )
            db.session.add(payment)
            db.session.commit()

            # Attempt online payment
            transaction_id = mpesa_client.stk_push(
                phone_number=payment.phone_number,
                amount=payment.amount,
                reference=f"ANIMAL-{payment.animal_id}"
            )
            payment.transaction_id = transaction_id
            payment.status = 'success'
            payment.synced = True
            db.session.commit()

            synced.append(payment.to_dict())
        except Exception as e:
            db.session.rollback()
            failed.append({"payment": p, "error": str(e)})

    return jsonify({"success": True, "synced": synced, "failed": failed})
