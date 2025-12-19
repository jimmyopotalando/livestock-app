# server/routes/api_routes.py

import os
from flask import request, jsonify
from werkzeug.utils import secure_filename

# Relative imports
from ..models import db
from ..models.animal import Animal, Owner
from ..utils.id_generator import generate_animal_id, generate_owner_id
from ..utils.image_processor import save_images
from ..utils.facial_recognition.recognizer import recognize_animal

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
    try:
        image_file = request.files.get('image')
        if not image_file:
            return jsonify({'success': False, 'error': 'No image uploaded.'}), 400

        image_path = os.path.join(UPLOAD_FOLDER, secure_filename(image_file.filename))
        image_file.save(image_path)

        result = recognize_animal(image_path)

        if result:
            animal, owner = result['animal'], result['owner']
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
