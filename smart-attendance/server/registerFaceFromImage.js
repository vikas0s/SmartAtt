/**
 * Register Face Data from Image File
 * 
 * This script extracts face descriptors from an image using face-api.js
 * and registers them in the database for a specific student.
 * 
 * Usage: node registerFaceFromImage.js
 */

require('dotenv').config({ path: '../.env' });
const path = require('path');
const faceapi = require('face-api.js');

// Polyfill for node-canvas
let canvas, faceDetectionNet;
try {
  const canvasModule = require('canvas');
  const { Canvas, Image, ImageData } = canvasModule;
  faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
  canvas = canvasModule;
} catch (e) {
  console.error('❌ canvas package not available. Install with: npm install canvas');
  console.log('Falling back to browser-based registration...');
}

const connectDB = require('./config/db');
const User = require('./models/User');
const FaceData = require('./models/FaceData');

const MODEL_PATH = path.resolve(__dirname, '../client/public/models');
const IMAGE_PATH = path.resolve(__dirname, '../client/public/students/vikas_sharma.png');

async function registerFace() {
  try {
    // Connect to database
    await connectDB();
    console.log('');

    // Load face-api models
    console.log('📦 Loading face recognition models...');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    console.log('✅ Models loaded');

    // Load the image
    console.log(`📷 Loading image: ${IMAGE_PATH}`);
    const img = await canvas.loadImage(IMAGE_PATH);

    // Create canvas from image
    const cvs = canvas.createCanvas(img.width, img.height);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Detect face and extract descriptor
    console.log('🧠 Detecting face...');
    const detections = await faceapi
      .detectAllFaces(cvs, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      console.error('❌ No face detected in the image');
      process.exit(1);
    }

    if (detections.length > 1) {
      console.warn(`⚠️  ${detections.length} faces detected, using the first one`);
    }

    const descriptor = Array.from(detections[0].descriptor);
    const confidence = (detections[0].detection.score * 100).toFixed(2);
    console.log(`✅ Face detected with ${confidence}% confidence`);
    console.log(`📐 Descriptor length: ${descriptor.length} points`);

    // Generate 5 slightly varied samples from the same image 
    // (adding tiny noise for robustness - in production, use 5 different photos)
    const descriptors = [descriptor];
    for (let i = 0; i < 4; i++) {
      const varied = descriptor.map(v => v + (Math.random() - 0.5) * 0.01);
      descriptors.push(varied);
    }
    console.log(`📸 Generated ${descriptors.length} face samples`);

    // Find the student
    const student = await User.findOne({ email: 'vikas@student.com' });
    if (!student) {
      console.error('❌ Student "Vikas Sharma" not found in database');
      process.exit(1);
    }

    console.log(`👤 Found student: ${student.name} (${student.enrollmentNumber})`);

    // Save face data
    let faceData = await FaceData.findOne({ studentId: student._id });
    if (faceData) {
      faceData.descriptors = descriptors;
      faceData.capturedAt = Date.now();
      await faceData.save();
      console.log('🔄 Face data updated');
    } else {
      faceData = await FaceData.create({
        studentId: student._id,
        descriptors,
        capturedAt: Date.now(),
      });
      console.log('✨ Face data created');
    }

    // Update user flag
    student.faceRegistered = true;
    student.profileImage = '/students/vikas_sharma.png';
    await student.save({ validateModifiedOnly: true });

    console.log('');
    console.log('🎉 Face registration complete!');
    console.log(`   Student: ${student.name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Enrollment: ${student.enrollmentNumber}`);
    console.log(`   Samples: ${descriptors.length}`);
    console.log(`   Profile Image: /students/vikas_sharma.png`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

registerFace();
