import unittest
import json
from server.app import app  # Adjust import according to your app.py location

class ApiRoutesTestCase(unittest.TestCase):
    def setUp(self):
        # Set up test client
        self.app = app.test_client()
        self.app.testing = True

    def test_welcome(self):
        # Test root or welcome endpoint if any
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        # You can check response data if you have a welcome route
        # self.assertIn(b'Welcome', response.data)

    def test_register_animal(self):
        # Sample payload for animal registration
        payload = {
            "owner_id": "O-NE12345",
            "owner_name": "John Doe",
            "owner_phone": "+254701234567",
            "owner_location": "North East Gem",
            # Normally images come as files - here just dummy filenames or base64 strings for test
            "animal_images": {
                "front": "base64stringfront",
                "back": "base64stringback",
                "left": "base64stringleft",
                "right": "base64stringright"
            }
        }

        response = self.app.post('/api/register', 
                                 data=json.dumps(payload),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('animal_id', data)
        self.assertEqual(data['owner_name'], 'John Doe')

    def test_verify_animal_no_match(self):
        # Example test for verification with no matching animal
        payload = {
            "image": "base64encodedimage"  # placeholder image string
        }
        response = self.app.post('/api/verify',
                                 data=json.dumps(payload),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertEqual(data['message'], 'No match found')

if __name__ == '__main__':
    unittest.main()
