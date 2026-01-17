from flask import Blueprint, request, jsonify
from server.models.ownership_history import db, OwnershipHistory
from datetime import datetime
from server.utils.payment_guard import PaymentGuard  # ✅ Import payment guard
from server.utils.id_validator import animal_exists     # ✅ Import animal ID validator
from sqlalchemy.exc import SQLAlchemyError
from server.utils.logger import logger  # ✅ Added logger

ownership_bp = Blueprint('ownership_bp', __name__, url_prefix='/ownership')


@ownership_bp.route('/change', methods=['POST'])
def change_ownership():
    """
    Change ownership of an animal.
    Expected JSON payload:
    {
        "animal_id": "123ABC",
        "previous_owner_id": "OWNER001",
        "new_owner_id": "OWNER002",
        "reason": "Sold",
        "offline": false  # optional, default false
    }
    """
    data = request.get_json()

    animal_id = data.get('animal_id')
    previous_owner_id = data.get('previous_owner_id')
    new_owner_id = data.get('new_owner_id')
    reason = data.get('reason', '')
    offline = data.get('offline', False)

    if not animal_id or not previous_owner_id or not new_owner_id:
        logger.warning(f"Ownership change attempt with missing fields: {data}")
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # ✅ Validate animal ID
    if not animal_exists(animal_id):
        logger.warning(f"Ownership change attempt with invalid animal_id: {animal_id}")
        return jsonify({"success": False, "message": "Invalid animal_id"}), 400

    # ✅ Enforce payment check
    if not PaymentGuard.has_paid(animal_id, 'ownership'):
        logger.warning(f"Ownership change blocked for animal_id={animal_id}: Payment not found or not successful")
        return jsonify({"success": False, "message": "Ownership change blocked: Payment not found or not successful"}), 402

    try:
        record = OwnershipHistory(
            animal_id=animal_id,
            previous_owner_id=previous_owner_id,
            new_owner_id=new_owner_id,
            reason=reason,
            timestamp=datetime.utcnow(),
            synced=not offline,
        )
        db.session.add(record)
        db.session.commit()

        logger.info(f"Ownership change recorded for animal_id={animal_id}, offline={offline}")
        return jsonify({"success": True, "record": record.to_dict(), "offline": offline})

    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to record ownership change for animal_id={animal_id}: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@ownership_bp.route('/sync_offline', methods=['POST'])
def sync_offline_ownership_changes():
    """
    Sync offline ownership changes.
    Expects an array of changes:
    [
        {
            "animal_id": "...",
            "previous_owner_id": "...",
            "new_owner_id": "...",
            "reason": "Sold"
        },
        ...
    ]
    """
    changes = request.get_json()
    if not changes or not isinstance(changes, list):
        logger.warning("Offline ownership sync attempt with invalid payload")
        return jsonify({"success": False, "message": "Invalid payload"}), 400

    synced = []
    failed = []

    try:
        # ✅ Wrap entire batch in a single transaction
        with db.session.begin():
            for change in changes:
                animal_id = change.get('animal_id')

                # ✅ Validate animal ID
                if not animal_exists(animal_id):
                    failed.append({"change": change, "error": "Invalid animal_id"})
                    logger.warning(f"Offline ownership change skipped: invalid animal_id {animal_id}")
                    continue  # Skip this change

                # ✅ Payment check per change
                if not PaymentGuard.has_paid(animal_id, 'ownership'):
                    failed.append({"change": change, "error": "Payment not found or not successful"})
                    logger.warning(f"Offline ownership change skipped for animal_id={animal_id}: payment not found")
                    continue  # Skip this change

                record = OwnershipHistory(
                    animal_id=animal_id,
                    previous_owner_id=change.get('previous_owner_id'),
                    new_owner_id=change.get('new_owner_id'),
                    reason=change.get('reason', ''),
                    timestamp=datetime.utcnow(),
                    synced=True  # mark as synced immediately
                )
                db.session.add(record)
                synced.append(record.to_dict())
                logger.info(f"Offline ownership change synced for animal_id={animal_id}")

        # ✅ Return results after successful transaction
        return jsonify({"success": True, "synced": synced, "failed": failed})

    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to sync offline ownership changes: {str(e)}")
        # Mark all as failed if transaction fails
        return jsonify({"success": False, "synced": [], "failed": changes, "error": str(e)})
