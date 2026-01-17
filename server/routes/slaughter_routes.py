from flask import Blueprint, request, jsonify
from server.models.slaughter_record import db, SlaughterRecord
from datetime import datetime
from server.utils.payment_guard import PaymentGuard  # ✅ Import payment guard
from server.utils.id_validator import animal_exists     # ✅ Import animal ID validator
from sqlalchemy.exc import SQLAlchemyError
from server.utils.logger import logger  # ✅ Added logger

slaughter_bp = Blueprint('slaughter_bp', __name__, url_prefix='/slaughter')


@slaughter_bp.route('/record', methods=['POST'])
def record_slaughter():
    """
    Record a slaughtered animal.
    Expected JSON payload:
    {
        "animal_id": "123ABC",
        "owner_id": "OWNER001",
        "reason": "Meat Sale",
        "location": "Farm A",
        "offline": false  # optional
    }
    """
    data = request.get_json()

    animal_id = data.get('animal_id')
    owner_id = data.get('owner_id')
    reason = data.get('reason', '')
    location = data.get('location', '')
    offline = data.get('offline', False)

    if not animal_id or not owner_id:
        logger.warning(f"Slaughter record attempt with missing fields: {data}")
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # ✅ Validate animal ID
    if not animal_exists(animal_id):
        logger.warning(f"Slaughter record attempt with invalid animal_id: {animal_id}")
        return jsonify({"success": False, "message": "Invalid animal_id"}), 400

    # ✅ Enforce payment check
    if not PaymentGuard.has_paid(animal_id, 'slaughter'):
        logger.warning(f"Slaughter blocked for animal_id={animal_id}: Payment not found or not successful")
        return jsonify({"success": False, "message": "Slaughter blocked: Payment not found or not successful"}), 402

    try:
        record = SlaughterRecord(
            animal_id=animal_id,
            owner_id=owner_id,
            reason=reason,
            location=location,
            timestamp=datetime.utcnow(),
            synced=not offline,
        )
        db.session.add(record)
        db.session.commit()

        logger.info(f"Slaughter record created for animal_id={animal_id}, offline={offline}")
        return jsonify({"success": True, "record": record.to_dict(), "offline": offline})

    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to record slaughter for animal_id={animal_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@slaughter_bp.route('/sync_offline', methods=['POST'])
def sync_offline_slaughter_records():
    """
    Sync offline slaughter records.
    Expects an array of slaughter records:
    [
        {
            "animal_id": "...",
            "owner_id": "...",
            "reason": "...",
            "location": "..."
        },
        ...
    ]
    """
    records = request.get_json()
    if not records or not isinstance(records, list):
        logger.warning("Offline slaughter sync attempt with invalid payload")
        return jsonify({"success": False, "message": "Invalid payload"}), 400

    synced = []
    failed = []

    try:
        # ✅ Wrap entire batch in a single transaction
        with db.session.begin():
            for r in records:
                animal_id = r.get('animal_id')
                owner_id = r.get('owner_id')

                # ✅ Validate animal ID
                if not animal_exists(animal_id):
                    failed.append({"record": r, "error": "Invalid animal_id"})
                    logger.warning(f"Offline slaughter record skipped: invalid animal_id {animal_id}")
                    continue  # Skip this record

                # ✅ Payment check per record
                if not PaymentGuard.has_paid(animal_id, 'slaughter'):
                    failed.append({"record": r, "error": "Payment not found or not successful"})
                    logger.warning(f"Offline slaughter record skipped for animal_id={animal_id}: payment not found")
                    continue  # Skip this record

                record = SlaughterRecord(
                    animal_id=animal_id,
                    owner_id=owner_id,
                    reason=r.get('reason', ''),
                    location=r.get('location', ''),
                    timestamp=datetime.utcnow(),
                    synced=True  # mark as synced immediately
                )
                db.session.add(record)
                synced.append(record.to_dict())
                logger.info(f"Offline slaughter record synced for animal_id={animal_id}")

        # ✅ Return results after successful transaction
        return jsonify({"success": True, "synced": synced, "failed": failed})

    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to sync offline slaughter records: {str(e)}")
        # Mark all as failed if transaction fails
        return jsonify({"success": False, "synced": [], "failed": records, "error": str(e)})
