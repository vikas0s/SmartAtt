require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Session.deleteMany({});
    await Attendance.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create admin
    const admin = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'admin@smart-attendance.com',
      password: 'admin123',
      role: 'admin',
      department: 'Computer Science',
    });
    console.log('👨‍💼 Admin created:', admin.email);

    // Create students
    const students = await User.create([
      {
        name: 'Vikas Sharma',
        email: 'vikas@student.com',
        password: 'student123',
        role: 'student',
        enrollmentNumber: 'CS2024001',
        department: 'Computer Science',
        semester: 6,
      },
      {
        name: 'Priya Singh',
        email: 'priya@student.com',
        password: 'student123',
        role: 'student',
        enrollmentNumber: 'CS2024002',
        department: 'Computer Science',
        semester: 6,
      },
      {
        name: 'Amit Patel',
        email: 'amit@student.com',
        password: 'student123',
        role: 'student',
        enrollmentNumber: 'CS2024003',
        department: 'Computer Science',
        semester: 6,
      },
      {
        name: 'Sneha Gupta',
        email: 'sneha@student.com',
        password: 'student123',
        role: 'student',
        enrollmentNumber: 'EC2024001',
        department: 'Electronics',
        semester: 4,
      },
      {
        name: 'Rahul Verma',
        email: 'rahul@student.com',
        password: 'student123',
        role: 'student',
        enrollmentNumber: 'ME2024001',
        department: 'Mechanical',
        semester: 4,
      },
      {
        name: 'Ananya Reddy',
        email: 'ananya@student.com',
        password: 'student123',
        role: 'student',
        enrollmentNumber: 'CS2024004',
        department: 'Computer Science',
        semester: 6,
      },
      {
        name: 'Karthik Nair',
        email: 'karthik@student.com',
        password: 'student123',
        role: 'student',
        enrollmentNumber: 'IT2024001',
        department: 'Information Technology',
        semester: 6,
      },
      {
        name: 'Meera Joshi',
        email: 'meera@student.com',
        password: 'student123',
        role: 'student',
        enrollmentNumber: 'CS2024005',
        department: 'Computer Science',
        semester: 4,
      },
    ]);

    console.log(`👩‍🎓 ${students.length} students created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@smart-attendance.com / admin123');
    console.log('   Student: vikas@student.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
