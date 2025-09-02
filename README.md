# 🐄 Livestock Registration & Verification App

A mobile and backend solution for registering and verifying livestock using image recognition and machine learning.


## 📱 Features

- Animal registration with images (front, back, left, right)
- Auto-generation of unique Animal & Owner IDs
- Image-based verification using ML (OpenCV/Dlib/FaceNet)
- Unregistered animal alert system
- Admin dashboard for verification and alerts
- React Native frontend + Flask backend


## 🛠 Tech Stack

| Layer         | Tech                          |
|---------------|-------------------------------|
| Frontend      | React Native (via Expo)       |
| Backend       | Flask (Python)                |
| ML / Vision   | OpenCV, Dlib, face_recognition|
| DB            | SQLite (or PostgreSQL/MySQL)  |
| Storage       | Local filesystem (or S3)      |



## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js + npm or yarn
- Expo CLI: `npm install -g expo-cli`
- pipenv or virtualenv (optional but recommended)



### 🔧 Backend Setup

cd server/
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

pip install -r requirements.txt

# Run the app
python app.py

💡 The API will run at: http://localhost:5000

📱 Frontend Setup (React Native)
cd client/
npm install
npx expo start


💡 Scan QR code with Expo Go app to test on your phone.




✅ API Endpoints


| Method | Endpoint      | Description                     |
| ------ | ------------- | ------------------------------- |
| POST   | /api/register | Register a new animal           |
| POST   | /api/verify   | Verify animal by image          |
| GET    | /api/alerts   | List unregistered animal alerts |


🧪 Running Tests
cd server/
python -m unittest discover tests


🧠 Machine Learning
Uses facial/image recognition via:
OpenCV for preprocessing
Dlib / FaceNet for embedding & matching
uploads/ folder stores raw images


📦 Future Improvements

Integrate AWS S3 for image storage
Push notifications for alerts
OTP or biometric owner verification
Admin dashboard as a web interface
Enhanced ML accuracy using deep feature embeddings
Geo-tagging captured images


🙌 Acknowledgments

This app was developed to assist North East Gem authorities and livestock owners in ensuring proper documentation, traceability, and transparency in livestock handling and trading.