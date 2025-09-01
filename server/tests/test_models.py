import unittest
from server.app import app, db  # Adjust imports based on your app structure
from server.models.animal import Animal

class AnimalModelTestCase(unittest.TestCase):
    def setUp(self):
        # Configure app for testing with in-memory SQLite DB
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app_context = app.app_context()
        self.app_context.push()

        # Initialize database and create tables
        db.create_all()

    def tearDown(self):
        # Clean up DB and app context
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_create_animal(self):
        # Create an animal record
        animal = Animal(
            animal_id='A-NE12345',
            owner_id='O-NE67890',
            owner_name='Jane Doe',
            owner_phone='+254701234567',
            owner_location='North East Gem',
            # Add other fields as needed
        )
        db.session.add(animal)
        db.session.commit()

        # Fetch the animal back
        found = Animal.query.filter_by(animal_id='A-NE12345').first()
        self.assertIsNotNone(found)
        self.assertEqual(found.owner_name, 'Jane Doe')
        self.assertEqual(found.owner_phone, '+254701234567')

    def test_animal_unique_id(self):
        # Test animal_id uniqueness if enforced
        animal1 = Animal(animal_id='A-NE11111', owner_name='Owner1')
        animal2 = Animal(animal_id='A-NE11111', owner_name='Owner2')  # same ID
        
        db.session.add(animal1)
        db.session.commit()
        
        with self.assertRaises(Exception):
            db.session.add(animal2)
            db.session.commit()

if __name__ == '__main__':
    unittest.main()
