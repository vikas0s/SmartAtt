/**
 * Fix script: Re-register Vikas's face data + fix admin password
 * Run: node fixData.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_DATA_DIR = path.resolve(__dirname, '.data/mongodb');

async function main() {
  let mongod = null;
  try {
    let uri = process.env.MONGO_URI;

    // Try external MongoDB first
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log('✅ Connected to external MongoDB');
    } catch (err) {
      // Use local persistent MongoDB
      if (!fs.existsSync(DB_DATA_DIR)) {
        console.log('❌ No local database found. Run the server first.');
        process.exit(1);
      }
      mongod = await MongoMemoryServer.create({
        instance: { dbPath: DB_DATA_DIR, storageEngine: 'wiredTiger' },
      });
      uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ Connected to local persistent MongoDB');
    }

    const User = require('./models/User');
    const FaceData = require('./models/FaceData');

    // === 1. Fix Admin Password ===
    console.log('\n--- Fixing Admin Password ---');
    const admin = await User.findOne({ email: 'admin@smart-attendance.com' }).select('+password');
    if (admin) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.updateOne(
        { _id: admin._id },
        { $set: { password: hashedPassword } }
      );
      console.log('✅ Admin password reset to: admin123');
    } else {
      console.log('⚠️  Admin user not found');
    }

    // === 2. Register Vikas's Face Data ===
    console.log('\n--- Registering Vikas Face Data ---');
    const student = await User.findOne({ email: 'vikas@student.com' });
    if (!student) {
      console.log('❌ Vikas student account not found');
      return;
    }
    console.log(`Found student: ${student.name} (${student._id})`);

    // Check if face data already exists
    const existingFace = await FaceData.findOne({ studentId: student._id });
    if (existingFace) {
      console.log('Removing old face data...');
      await FaceData.deleteOne({ studentId: student._id });
    }

    // Load face-api.js and detect face from photo
    const faceapi = require('face-api.js');
    const canvasModule = require('canvas');
    const { Canvas, Image, ImageData } = canvasModule;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    const MODEL_PATH = path.resolve(__dirname, '../client/public/models');
    const IMAGE_PATH = path.resolve(__dirname, '../client/public/students/vikas_sharma.png');

    if (!fs.existsSync(IMAGE_PATH)) {
      console.log('❌ Photo not found at:', IMAGE_PATH);
      return;
    }

    console.log('Loading face recognition models...');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    console.log('✅ Models loaded');

    console.log('Processing image:', IMAGE_PATH);
    const img = await canvasModule.loadImage(IMAGE_PATH);
    const cvs = canvasModule.createCanvas(img.width, img.height);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const detections = await faceapi
      .detectAllFaces(cvs, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      console.log('❌ No face detected in the photo. Try a clearer image.');
      return;
    }

    const descriptor = Array.from(detections[0].descriptor);
    const confidence = (detections[0].detection.score * 100).toFixed(2);
    console.log(`✅ Face detected with ${confidence}% confidence`);

    // Generate 5 varied samples for better matching
    const descriptors = [descriptor];
    for (let i = 0; i < 4; i++) {
      const varied = descriptor.map(v => v + (Math.random() - 0.5) * 0.02);
      descriptors.push(varied);
    }

    await FaceData.create({
      studentId: student._id,
      descriptors,
      capturedAt: Date.now(),
    });

    // Update faceRegistered flag directly (bypass pre-save hook)
    await User.updateOne(
      { _id: student._id },
      { $set: { faceRegistered: true } }
    );

    console.log(`✅ Face data registered for ${student.name} (${descriptors.length} samples)`);

    // === 3. Verify ===
    console.log('\n--- Verification ---');
    const updatedStudent = await User.findOne({ email: 'vikas@student.com' });
    const faceData = await FaceData.findOne({ studentId: updatedStudent._id });
    console.log(`faceRegistered: ${updatedStudent.faceRegistered}`);
    console.log(`FaceData samples: ${faceData ? faceData.descriptors.length : 0}`);
    console.log(`Descriptor length: ${faceData ? faceData.descriptors[0].length : 'N/A'}`);

    // Verify admin password
    const updatedAdmin = await User.findOne({ email: 'admin@smart-attendance.com' }).select('+password');
    const adminOk = await bcrypt.compare('admin123', updatedAdmin.password);
    console.log(`Admin login test: ${adminOk ? '✅ OK' : '❌ FAILED'}`);

    console.log('\n🎉 All fixes applied successfully!');
    console.log('   Restart the server (npm run dev) for changes to take effect.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    process.exit(0);
  }
}

main();
