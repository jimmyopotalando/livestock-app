# utils/id_generator.py

import random
import string

def generate_animal_id(location_code='NE'):
    """Generate a unique Animal ID like A-NE12345"""
    unique_number = ''.join(random.choices(string.digits, k=5))
    return f"A-{location_code}{unique_number}"

def generate_owner_id(location_code='NE'):
    """Generate a unique Owner ID like O-NE67890"""
    unique_number = ''.join(random.choices(string.digits, k=5))
    return f"O-{location_code}{unique_number}"
