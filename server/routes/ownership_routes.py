# server/routes/ownership_routes.py
from flask import Blueprint, request, jsonify
from server.models.ownership_history import db, OwnershipHistory
from datetime import datetime

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
        return jsonify({"success": False, "message": "Missing required fields"}), 400

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

        return jsonify({"success": True, "record": record.to_dict(), "offline": offline})

    except Exception as e:
        db.session.rollback()
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
        return jsonify({"success": False, "message": "Invalid payload"}), 400

    synced = []
    failed = []

    for change in changes:
        try:
            record = OwnershipHistory(
                animal_id=change.get('animal_id'),
                previous_owner_id=change.get('previous_owner_id'),
                new_owner_id=change.get('new_owner_id'),
                reason=change.get('reason', ''),
                timestamp=datetime.utcnow(),
                synced=False
            )
            db.session.add(record)
            db.session.commit()

            # Mark as synced after successful commit
            record.synced = True
            db.session.commit()
            synced.append(record.to_dict())

        except Exception as e:
            db.session.rollback()
            failed.append({"change": change, "error": str(e)})

    return jsonify({"success": True, "synced": synced, "failed": failed})
