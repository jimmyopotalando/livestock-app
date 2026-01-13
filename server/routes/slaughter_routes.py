# server/routes/slaughter_routes.py
from flask import Blueprint, request, jsonify
from server.models.slaughter_record import db, SlaughterRecord
from datetime import datetime

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
        return jsonify({"success": False, "message": "Missing required fields"}), 400

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

        return jsonify({"success": True, "record": record.to_dict(), "offline": offline})

    except Exception as e:
        db.session.rollback()
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
        return jsonify({"success": False, "message": "Invalid payload"}), 400

    synced = []
    failed = []

    for r in records:
        try:
            record = SlaughterRecord(
                animal_id=r.get('animal_id'),
                owner_id=r.get('owner_id'),
                reason=r.get('reason', ''),
                location=r.get('location', ''),
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
            failed.append({"record": r, "error": str(e)})

    return jsonify({"success": True, "synced": synced, "failed": failed})
