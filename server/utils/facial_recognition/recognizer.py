# server/utils/facial_recognition/recognizer.py

import cv2
import numpy as np

def recognize_animal(candidate_image, known_embeddings_dict=None):
    """
    Dummy animal recognizer using OpenCV only.
    Currently, this is a placeholder that always returns None (no match).

    Args:
        candidate_image: image file path or BGR numpy array
        known_embeddings_dict: dict mapping Animal ID -> embedding (optional)

    Returns:
        None, meaning no match found.
    """
    # Load image if a path is provided
    if isinstance(candidate_image, str):
        candidate_image = cv2.imread(candidate_image)
        if candidate_image is None:
            return None  # Invalid image path

    # Placeholder logic:
    # In the future, you can compute embeddings or use template matching
    # For now, always return None (no match)
    return None
