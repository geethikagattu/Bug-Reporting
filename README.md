# AI-Based Bug Tracking and Issue Management System

A futuristic, full-stack application that automates bug classification, localization, and assignment using machine learning.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, React Three Fiber (3D Background)
- **Backend API**: Node.js, Express, MongoDB, JWT
- **AI Microservice**: Python, Flask, Scikit-learn (TF-IDF, SVM)

## System Architecture
The application runs on three independent services:
1. **Frontend** (Port 3000): Role-based dashboards (Admin, Developer, Tester) with a custom 3D particle background and neon glassmorphic UI.
2. **Backend Express API** (Port 8000): Handles user authentication, database CRUD operations, and coordinates with the ML service.
3. **ML Python Service** (Port 5000): Provides NLP classification to determine if a bug is valid, and uses cosine similarity to localize bugs to source files.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Backend Setup
1. Open a terminal and navigate to the backend folder: `cd "backend"`
2. Start the development server:
```bash
node server.js
```

### 2. Machine Learning Setup
1. Open a terminal and navigate to the ml-service folder: `cd "ml-service"`
2. Activate the virtual environment: `.\venv\Scripts\activate`
3. Run the Flask server (runs on port 5000):
```bash
python app.py
```

### 3. Frontend Setup
1. Open a terminal and navigate to the frontend folder: `cd "frontend"`
2. Start the Next.js app (runs on port 3000):
```bash
npm run dev
```

### Accessing the Platform
Visit **http://localhost:3000**.
Register an account and choose your **Role** (Tester, Developer, Admin) carefully to access the corresponding futuristic dashboards.

## Deployment Guide
- **Frontend**: Deploy directly to Vercel via GitHub import. Ensure Next.js framework preset is selected.
- **Backend**: Deploy to Render or Heroku. Make sure to set `MONGO_URI` environment variable pointing to your MongoDB Atlas cluster.
- **ML Service**: Deploy on Render (Web Service) using a basic Gunicorn command `gunicorn app:app`.
