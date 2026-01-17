import os
from flask import request, jsonify
from werkzeug.utils import secure_filename

# Relative imports
from ..models import db
from ..models.animal import Animal, Owner
from ..utils.id_generator import generate_animal_id, generate_owner_id
from ..utils.image_processor import save_images
from ..utils.facial_recognition.recognizer import recognize_animal
from ..utils.id_validator import animal_exists  # ✅ Import validator
from ..utils.logger import log_event  # optional logging

from . import api_bp

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')


@api_bp.route('/register', methods=['POST'])
def register_animal():
    try:
        owner_name = request.form.get('owner_name')
        owner_phone = request.form.get('owner_phone')
        owner_location = request.form.get('owner_location')
        owner_id = request.form.get('owner_id') or generate_owner_id()

        # Save or get owner
        owner = Owner.query.filter_by(owner_id=owner_id).first()
        if not owner:
            owner = Owner(
                owner_id=owner_id,
                name=owner_name,
                phone=owner_phone,
                location=owner_location
            )
            db.session.add(owner)
            db.session.commit()

        # Generate animal ID
        animal_id = generate_animal_id()

        # Save images
        image_paths = save_images(request.files, animal_id, UPLOAD_FOLDER)

        # Create Animal record
        animal = Animal(
            animal_id=animal_id,
            owner_id=owner.id,
            image_front=image_paths['front'],
            image_back=image_paths['back'],
            image_left=image_paths['left'],
            image_right=image_paths['right']
        )

        db.session.add(animal)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Animal registered successfully.',
            'animal_id': animal.animal_id,
            'owner_id': owner.owner_id,
            'owner_name': owner.name,
            'owner_phone': owner.phone,
            'owner_location': owner.location
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/verify', methods=['POST'])
def verify_animal():
    """
    Server-side verification:
    - Requires 4 images: front/back/left/right
    - Requires GPS: latitude & longitude
    - Optional timestamp
    """
    try:
        animal_id = request.form.get('animal_id')
        gps_lat = request.form.get('latitude', type=float)
        gps_lng = request.form.get('longitude', type=float)
        timestamp = request.form.get('timestamp')

        # Collect 4 images
        image_files = {
            'front': request.files.get('image_front'),
            'back': request.files.get('image_back'),
            'left': request.files.get('image_left'),
            'right': request.files.get('image_right')
        }

        # 1️⃣ Validate animal_id
        if animal_id and not animal_exists(animal_id):
            return jsonify({'success': False, 'error': 'Invalid or unregistered animal_id.'}), 400

        # 2️⃣ Validate images
        missing_images = [k for k, v in image_files.items() if v is None]
        if missing_images:
            return jsonify({
                'success': False,
                'error': f'Missing images: {", ".join(missing_images)}'
            }), 400

        # 3️⃣ Validate GPS
        if gps_lat is None or gps_lng is None:
            return jsonify({'success': False, 'error': 'GPS coordinates are required.'}), 400
        if not (-90 <= gps_lat <= 90) or not (-180 <= gps_lng <= 180):
            return jsonify({'success': False, 'error': 'Invalid GPS coordinates.'}), 400

        # 4️⃣ Validate timestamp
        if not timestamp:
            return jsonify({'success': False, 'error': 'Timestamp is required.'}), 400

        # 5️⃣ Save images
        image_paths = {}
        for key, file in image_files.items():
            filename = secure_filename(file.filename)
            path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(path)
            image_paths[key] = path

        # 6️⃣ Perform recognition
        result = recognize_animal(image_paths)

        # 7️⃣ Log verification attempt
        log_event(f"Verification attempted for animal {animal_id or 'unknown'} with GPS ({gps_lat},{gps_lng})")

        if result:
            animal, owner = result['animal'], result['owner']
            if not animal_exists(animal.animal_id):
                return jsonify({'success': False, 'error': 'Animal not found in database.'}), 400

            return jsonify({
                'success': True,
                'match_found': True,
                'animal_id': animal.animal_id,
                'owner_id': owner.owner_id,
                'owner_name': owner.name,
                'owner_phone': owner.phone,
                'owner_location': owner.location
            })
        else:
            return jsonify({
                'success': True,
                'match_found': False,
                'message': 'No match found. Animal may be unregistered.'
            })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@api_bp.route('/alert', methods=['POST'])
def alert_authorities():
    try:
        data = request.get_json()
        reason = data.get('reason', 'Unregistered animal')
        timestamp = data.get('timestamp', 'Unknown')

        # In a real app, store alert in DB or send notification
        return jsonify({
            'success': True,
            'message': 'Alert received.',
            'details': {
                'reason': reason,
                'timestamp': timestamp
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
