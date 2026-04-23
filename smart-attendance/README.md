# 📍 SmartAttend - Intelligent Attendance System

A full-stack Smart Attendance System built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) featuring **AI-based Face Recognition** and **QR Code** fallback.

![MERN](https://img.shields.io/badge/Stack-MERN-green) ![Face API](https://img.shields.io/badge/AI-Face%20Recognition-blue) ![QR](https://img.shields.io/badge/Fallback-QR%20Code-orange) ![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-purple)

## ✨ Features

### 🧠 AI Face Recognition
- Real-time face detection and recognition using **face-api.js**
- 128-point face descriptor matching with Euclidean distance
- Multi-sample registration (5 face samples per student)
- Anti-spoofing: multi-face alerts, confidence thresholds
- Automatic attendance marking on successful match

### 📱 QR Code Attendance (Fallback)
- Dynamic QR code generation per session
- Auto-expiry (5 minutes configurable)
- Device fingerprinting to prevent proxy attendance
- One scan per student per session

### 🔐 Authentication
- JWT-based auth (access + refresh tokens)
- Role-based access (Admin / Student)
- Secure password hashing (bcrypt, 12 rounds)
- Auto token refresh and session management

### 📊 Real-time Dashboard
- Live attendance feed via Socket.IO
- Weekly trend charts and method distribution
- Student-wise attendance analytics
- CSV report export

### 👩‍💼 Admin Features
- Create and manage attendance sessions
- Register student face data
- View attendance reports with filters
- QR code projection for classrooms

### 👩‍🎓 Student Features
- Personal attendance dashboard
- Subject-wise attendance breakdown
- Attendance progress with eligibility threshold
- Mark attendance via face or QR

## 🗂️ Project Structure

```
smart-attendance/
├── client/                  → React.js Frontend (Vite)
│   ├── public/models/       → face-api.js ML models
│   └── src/
│       ├── components/      → Layout, Auth, UI components
│       ├── context/         → AuthContext (JWT)
│       ├── pages/           → All page components
│       └── App.jsx          → Router + App entry
│
├── server/                  → Node.js + Express Backend
│   ├── config/              → DB connection, JWT config
│   ├── controllers/         → auth, attendance, face, session
│   ├── middleware/          → authMiddleware, errorHandler
│   ├── models/              → User, FaceData, Attendance, Session
│   ├── routes/              → All API routes
│   ├── utils/               → faceUtils, qrUtils, tokenUtils
│   └── server.js            → Entry point
│
├── .env                     → Environment variables
├── package.json             → Root scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Webcam (for face recognition)

### 1. Clone & Install
```bash
cd smart-attendance
npm install
npm run install-all
```

### 2. Configure Environment
Edit `.env` in the root:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart-attendance
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
QR_EXPIRY_MINUTES=5
```

### 3. Seed Database (Optional)
```bash
cd server && npm run seed
```

### 4. Run Development
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### 5. Face Models
Models are pre-downloaded in `client/public/models/`. If missing, download from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## 📋 Demo Credentials

| Role    | Email                         | Password    |
|---------|-------------------------------|-------------|
| Admin   | admin@smart-attendance.com    | admin123    |
| Student | vikas@student.com             | student123  |

## 🔌 API Endpoints

### Authentication
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | /api/auth/register    | Register user            |
| POST   | /api/auth/login       | Login & get JWT          |
| POST   | /api/auth/logout      | Invalidate token         |
| GET    | /api/auth/me          | Get current user profile |
| POST   | /api/auth/refresh     | Refresh access token     |

### Face Recognition
| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| POST   | /api/face/register     | Register face descriptor |
| POST   | /api/face/recognize    | Match face & get student |
| GET    | /api/face/:studentId   | Get face data            |
| DELETE | /api/face/:studentId   | Remove face data         |

### Sessions
| Method | Endpoint                  | Description           |
|--------|---------------------------|-----------------------|
| POST   | /api/session/create       | Create session + QR   |
| GET    | /api/session/active       | Get active sessions   |
| GET    | /api/session/all          | All sessions (admin)  |
| GET    | /api/session/:sessionId   | Session details       |
| POST   | /api/session/scan         | Scan QR, mark attend. |
| POST   | /api/session/end/:id      | End a session         |

### Attendance
| Method | Endpoint                     | Description           |
|--------|------------------------------|-----------------------|
| POST   | /api/attendance/mark         | Mark attendance       |
| GET    | /api/attendance/student/:id  | Student's attendance  |
| GET    | /api/attendance/session/:id  | Session's attendance  |
| GET    | /api/attendance/report       | Filtered report       |
| GET    | /api/attendance/analytics    | Stats & analytics     |
| GET    | /api/attendance/students     | Students + attendance |

## 🛠️ Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18, Vite, Recharts, face-api.js         |
| Backend    | Node.js, Express.js, Socket.IO                |
| Database   | MongoDB + Mongoose                            |
| Auth       | JWT (access + refresh tokens), bcryptjs        |
| QR Code    | qrcode (server), html5-qrcode (client)        |
| Real-time  | Socket.IO                                     |

## 📄 License

MIT License - feel free to use for educational purposes.
