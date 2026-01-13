-- Table to store animal information
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id VARCHAR(20) UNIQUE NOT NULL,
    owner_id VARCHAR(20),
    owner_name VARCHAR(100) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    owner_location VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store image paths or URLs linked to animals
CREATE TABLE IF NOT EXISTS animal_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id VARCHAR(20) NOT NULL,
    image_type VARCHAR(10) NOT NULL,  -- e.g., 'front', 'back', 'left', 'right'
    image_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals (animal_id) ON DELETE CASCADE
);

-- Table for unregistered animal alerts
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_description TEXT,
    image_path TEXT,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to track payments (Mpesa or otherwise)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id VARCHAR(20) NOT NULL,
    owner_id VARCHAR(20) NOT NULL,
    payment_reference VARCHAR(50) UNIQUE NOT NULL,
    amount REAL NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals (animal_id) ON DELETE CASCADE
);

-- Table to track ownership history
CREATE TABLE IF NOT EXISTS ownership_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id VARCHAR(20) NOT NULL,
    previous_owner_id VARCHAR(20) NOT NULL,
    new_owner_id VARCHAR(20) NOT NULL,
    changed_by VARCHAR(50) NOT NULL,       -- e.g., admin ID
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (animal_id) REFERENCES animals (animal_id) ON DELETE CASCADE
);

-- Table to track slaughter records
CREATE TABLE IF NOT EXISTS slaughter_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id VARCHAR(20) NOT NULL,
    owner_id VARCHAR(20) NOT NULL,
    slaughtered_by VARCHAR(50) NOT NULL,  -- admin or staff
    slaughter_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    location VARCHAR(100),
    FOREIGN KEY (animal_id) REFERENCES animals (animal_id) ON DELETE CASCADE
);
