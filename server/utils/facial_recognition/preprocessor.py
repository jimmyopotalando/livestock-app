import cv2
import numpy as np

def preprocess_image(image, target_size=(160, 160)):
    """
    Preprocess the input image for facial recognition.
    
    Args:
        image (numpy.ndarray): Input image in BGR format.
        target_size (tuple): Desired output image size (width, height).
    
    Returns:
        preprocessed_image (numpy.ndarray): Processed image ready for model input.
    """
    # Convert to RGB as many models expect RGB input
    img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Resize to target size (FaceNet typically uses 160x160)
    img_resized = cv2.resize(img_rgb, target_size)

    # Normalize pixel values to range [0, 1]
    img_normalized = img_resized.astype('float32') / 255.0

    # Optional: standardize by subtracting mean and dividing by std dev (if model expects)
    # mean = np.mean(img_normalized, axis=(0,1), keepdims=True)
    # std = np.std(img_normalized, axis=(0,1), keepdims=True)
    # img_standardized = (img_normalized - mean) / std

    # Return the normalized image
    return img_normalized

def crop_face(image, face_rect):
    """
    Crop the detected face region from the image.
    
    Args:
        image (numpy.ndarray): Original image.
        face_rect (dlib.rectangle): Face bounding box detected by dlib.
    
    Returns:
        cropped_face (numpy.ndarray): Cropped face image.
    """
    x1 = face_rect.left()
    y1 = face_rect.top()
    x2 = face_rect.right()
    y2 = face_rect.bottom()

    # Ensure coordinates are within image bounds
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(image.shape[1], x2)
    y2 = min(image.shape[0], y2)

    return image[y1:y2, x1:x2]
