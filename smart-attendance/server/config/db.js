const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

let mongod = null;

// Persistent data directory for in-memory MongoDB
const DB_DATA_DIR = path.resolve(__dirname, '../.data/mongodb');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

    // Try connecting to externally configured MongoDB first
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      // In production (Vercel), don't fallback to in-memory — require real MongoDB
      if (isProduction) {
        console.error('❌ MongoDB connection failed. Set MONGO_URI in Vercel environment variables.');
        throw err;
      }
      console.log('⚠️  External MongoDB not available, starting local persistent server...');
    }

    // Ensure persistent data directory exists
    if (!fs.existsSync(DB_DATA_DIR)) {
      fs.mkdirSync(DB_DATA_DIR, { recursive: true });
    }

    // Start MongoDB with persistent storage using dbPath
    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: DB_DATA_DIR,
        storageEngine: 'wiredTiger',
      },
    });
    uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Local Persistent Connected: ${conn.connection.host}`);
    console.log(`📁 Data stored in: ${DB_DATA_DIR}`);

    // Only seed if database is empty (first run)
    await seedDemoData();

    // Always check if Vikas's face data needs registration (even after seed)
    const FaceData = require('../models/FaceData');
    const User = require('../models/User');
    const vikasUser = await User.findOne({ email: 'vikas@attendance.in' });
    if (vikasUser) {
      const faceExists = await FaceData.findOne({ studentId: vikasUser._id });
      if (!faceExists && !isProduction) {
        console.log('🧠 Face data missing for Vikas, registering...');
        await registerVikasFace();
      }
    }

    // Gracefully handle shutdowns to preserve MongoMemoryServer data
    const handleShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, safely shutting down MongoDB...`);
      if (mongoose.connection) {
        await mongoose.connection.close();
      }
      if (mongod) {
        await mongod.stop();
      }
      if (signal === 'SIGUSR2') {
        process.kill(process.pid, 'SIGUSR2');
      } else {
        process.exit(0);
      }
    };

    process.once('SIGINT', () => handleShutdown('SIGINT'));
    process.once('SIGTERM', () => handleShutdown('SIGTERM'));
    process.once('SIGUSR2', () => handleShutdown('SIGUSR2')); // nodemon restart

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const seedDemoData = async () => {
  const User = require('../models/User');
  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log(`📋 Database has ${existing} users, skipping seed.`);
    return;
  }

  console.log('🌱 Seeding demo data (first run)...');

  // Create admin
  await User.create({
    name: 'Dr. Rajesh Kumar',
    email: 'admin@admin.in',
    password: 'admin123',
    role: 'admin',
    department: 'Computer Science',
  });

  // Create students
  await User.create([
    {
      name: 'Vikas Sharma',
      email: 'vikas@attendance.in',
      password: 'student123',
      role: 'student',
      enrollmentNumber: 'CS2024001',
      department: 'Computer Science',
      semester: 6,
      profileImage: '/students/vikas_sharma.png',
    },
    {
      name: 'Priya Singh',
      email: 'priya@attendance.in',
      password: 'student123',
      role: 'student',
      enrollmentNumber: 'CS2024002',
      department: 'Computer Science',
      semester: 6,
    },
    {
      name: 'Amit Patel',
      email: 'amit@attendance.in',
      password: 'student123',
      role: 'student',
      enrollmentNumber: 'CS2024003',
      department: 'Computer Science',
      semester: 6,
    },
    {
      name: 'Sneha Gupta',
      email: 'sneha@attendance.in',
      password: 'student123',
      role: 'student',
      enrollmentNumber: 'EC2024001',
      department: 'Electronics',
      semester: 4,
    },
    {
      name: 'Rahul Verma',
      email: 'rahul@attendance.in',
      password: 'student123',
      role: 'student',
      enrollmentNumber: 'ME2024001',
      department: 'Mechanical',
      semester: 4,
    },
    {
      name: 'Ananya Reddy',
      email: 'ananya@attendance.in',
      password: 'student123',
      role: 'student',
      enrollmentNumber: 'CS2024004',
      department: 'Computer Science',
      semester: 6,
    },
    {
      name: 'Karthik Nair',
      email: 'karthik@attendance.in',
      password: 'student123',
      role: 'student',
      enrollmentNumber: 'IT2024001',
      department: 'Information Technology',
      semester: 6,
    },
    {
      name: 'Meera Joshi',
      email: 'meera@attendance.in',
      password: 'student123',
      role: 'student',
      enrollmentNumber: 'CS2024005',
      department: 'Computer Science',
      semester: 4,
    },
  ]);

  console.log('✅ Demo data seeded (admin + 8 students)');
  console.log('   Admin: admin@admin.in / admin123');
  console.log('   Student: vikas@attendance.in / student123');

  // Auto-register Vikas's face data from image
  await registerVikasFace();
};

const registerVikasFace = async () => {
  const FaceData = require('../models/FaceData');
  const User = require('../models/User');

  try {
    const faceapi = require('face-api.js');
    const canvasModule = require('canvas');
    const { Canvas, Image, ImageData } = canvasModule;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    const MODEL_PATH = path.resolve(__dirname, '../../client/public/models');
    const IMAGE_PATH = path.resolve(__dirname, '../../client/public/students/vikas_sharma.png');

    if (!fs.existsSync(IMAGE_PATH)) {
      console.log('⚠️  Vikas photo not found, skipping face registration');
      return;
    }

    console.log('🧠 Registering Vikas\'s face data...');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);

    const img = await canvasModule.loadImage(IMAGE_PATH);
    const cvs = canvasModule.createCanvas(img.width, img.height);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const detections = await faceapi
      .detectAllFaces(cvs, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      console.log('⚠️  No face detected in Vikas\'s photo');
      return;
    }

    const descriptor = Array.from(detections[0].descriptor);
    const confidence = (detections[0].detection.score * 100).toFixed(2);

    // Generate 5 slightly varied samples
    const descriptors = [descriptor];
    for (let i = 0; i < 4; i++) {
      const varied = descriptor.map(v => v + (Math.random() - 0.5) * 0.01);
      descriptors.push(varied);
    }

    const student = await User.findOne({ email: 'vikas@attendance.in' });
    if (!student) return;

    await FaceData.create({
      studentId: student._id,
      descriptors,
      capturedAt: Date.now(),
    });

    student.faceRegistered = true;
    await student.save({ validateModifiedOnly: true });

    console.log(`✅ Vikas face registered (${confidence}% confidence, 5 samples)`);
  } catch (error) {
    console.log('⚠️  Face registration skipped:', error.message);
  }
};

module.exports = connectDB;
