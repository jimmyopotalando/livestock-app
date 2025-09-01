# utils/image_processor.py

import os
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """Check if the file has an allowed image extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_images(files, animal_id, upload_folder):
    """
    Save the uploaded animal images with consistent filenames.
    
    Expected keys in files: 'front', 'back', 'left', 'right'
    
    Returns dict with saved file paths:
    {
      'front': 'uploads/A-NE12345_front.jpg',
      'back': 'uploads/A-NE12345_back.jpg',
      ...
    }
    """

    saved_paths = {}
    views = ['front', 'back', 'left', 'right']

    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    for view in views:
        file = files.get(view)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            ext = filename.rsplit('.', 1)[1].lower()
            new_filename = f"{animal_id}_{view}.{ext}"
            filepath = os.path.join(upload_folder, new_filename)
            file.save(filepath)
            saved_paths[view] = filepath
        else:
            # You can handle missing files or invalid files here
            saved_paths[view] = None

    return saved_paths
