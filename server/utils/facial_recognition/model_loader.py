import os
import dlib
import tensorflow as tf

# Global variables to hold the models (singleton pattern)
_facenet_model = None
_dlib_face_rec_model = None
_dlib_shape_predictor = None

def load_facenet_model(model_path='models/facenet_model.pb'):
    """
    Load the FaceNet model from a protobuf (.pb) file.
    """
    global _facenet_model
    if _facenet_model is None:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"FaceNet model file not found at {model_path}")
        
        # Load the TensorFlow model from .pb file
        with tf.io.gfile.GFile(model_path, "rb") as f:
            graph_def = tf.compat.v1.GraphDef()
            graph_def.ParseFromString(f.read())
        
        with tf.Graph().as_default() as graph:
            tf.import_graph_def(graph_def, name='')
        _facenet_model = graph
        print("FaceNet model loaded successfully.")
    return _facenet_model

def load_dlib_models(shape_predictor_path='models/shape_predictor_68_face_landmarks.dat',
                     face_rec_model_path='models/dlib_face_recognition_resnet_model_v1.dat'):
    """
    Load Dlib's face landmark predictor and face recognition model.
    """
    global _dlib_shape_predictor, _dlib_face_rec_model
    if _dlib_shape_predictor is None:
        if not os.path.exists(shape_predictor_path):
            raise FileNotFoundError(f"Shape predictor file not found at {shape_predictor_path}")
        _dlib_shape_predictor = dlib.shape_predictor(shape_predictor_path)
        print("Dlib shape predictor loaded.")
    if _dlib_face_rec_model is None:
        if not os.path.exists(face_rec_model_path):
            raise FileNotFoundError(f"Dlib face recognition model file not found at {face_rec_model_path}")
        _dlib_face_rec_model = dlib.face_recognition_model_v1(face_rec_model_path)
        print("Dlib face recognition model loaded.")
    return _dlib_shape_predictor, _dlib_face_rec_model
