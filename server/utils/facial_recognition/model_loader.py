import os
import dlib

BASE_DIR = os.path.dirname(__file__)

def load_dlib_models():
    """
    Loads Dlib's shape predictor and face recognition model.
    Assumes models are stored inside: server/utils/facial_recognition/models/
    """

    models_dir = os.path.join(BASE_DIR, "models")

    shape_predictor_path = os.path.join(models_dir, "shape_predictor_68_face_landmarks.dat")
    face_rec_model_path = os.path.join(models_dir, "dlib_face_recognition_resnet_model_v1.dat")

    if not os.path.exists(shape_predictor_path):
        raise FileNotFoundError(f"Missing Dlib model: {shape_predictor_path}")

    if not os.path.exists(face_rec_model_path):
        raise FileNotFoundError(f"Missing Dlib model: {face_rec_model_path}")

    # Load Dlib models
    shape_predictor = dlib.shape_predictor(shape_predictor_path)
    face_rec_model = dlib.face_recognition_model_v1(face_rec_model_path)

    return shape_predictor, face_rec_model
