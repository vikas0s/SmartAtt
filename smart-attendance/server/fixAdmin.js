require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
  const User = require('./models/User');

  // Fix admin passwords
  const admins = await User.find({ role: 'admin' }).select('+password');
  for (const a of admins) {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('admin123', salt);
    await User.updateOne({ _id: a._id }, { password: hash });
    console.log('Fixed password for:', a.email);
  }

  // Update Vikas's profile
  await User.updateOne(
    { email: 'vikas@student.com' },
    {
      name: 'Vikas Sharma',
      enrollmentNumber: 'CS2024001',
      department: 'Computer Science',
      semester: 6,
      profileImage: '/students/vikas_sharma.png',
    }
  );
  console.log('Updated Vikas Sharma profile');

  // Verify
  const vikas = await User.findOne({ email: 'vikas@student.com' });
  console.log('Vikas:', vikas.name, '| faceRegistered:', vikas.faceRegistered);

  const admin = await User.findOne({ role: 'admin' }).select('+password');
  const ok = await bcrypt.compare('admin123', admin.password);
  console.log('Admin login test:', ok ? 'OK' : 'FAILED');

  await mongoose.disconnect();
  process.exit(0);
}

run();
