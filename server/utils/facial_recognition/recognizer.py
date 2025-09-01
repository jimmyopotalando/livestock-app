import numpy as np
from utils.facial_recognition.model_loader import load_dlib_models
import dlib
import cv2

# Load Dlib models globally (for demo purpose)
shape_predictor, face_rec_model = load_dlib_models()

def get_face_embedding(image):
    """
    Detect face and compute the 128D face descriptor (embedding) using dlib.
    """
    detector = dlib.get_frontal_face_detector()
    faces = detector(image, 1)

    if len(faces) == 0:
        return None  # No face detected

    # For simplicity, take the first detected face
    face_rect = faces[0]

    # Get landmarks
    shape = shape_predictor(image, face_rect)

    # Compute face descriptor
    face_descriptor = face_rec_model.compute_face_descriptor(image, shape)

    # Convert to numpy array
    return np.array(face_descriptor)

def compare_embeddings(known_embedding, candidate_embedding, threshold=0.6):
    """
    Compare two face embeddings using Euclidean distance.
    Lower distance means higher similarity.
    """
    if known_embedding is None or candidate_embedding is None:
        return False

    dist = np.linalg.norm(known_embedding - candidate_embedding)
    return dist < threshold

def recognize_animal(candidate_image, known_embeddings_dict):
    """
    Recognize animal by comparing candidate_image embedding with known embeddings.
    
    Args:
      candidate_image: image (BGR numpy array)
      known_embeddings_dict: dict mapping Animal ID -> embedding (numpy array)
      
    Returns:
      matched_animal_id (str) if found, else None
    """

    candidate_embedding = get_face_embedding(candidate_image)
    if candidate_embedding is None:
        return None  # No face/animal detected in image

    # Compare with known embeddings
    for animal_id, embedding in known_embeddings_dict.items():
        if compare_embeddings(embedding, candidate_embedding):
            return animal_id  # Match found

    return None  # No match found
