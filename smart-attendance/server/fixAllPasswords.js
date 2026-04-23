require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
  const User = require('./models/User');

  const users = await User.find({}).select('+password');
  console.log(`Found ${users.length} users\n`);

  for (const u of users) {
    const defaultPw = u.role === 'admin' ? 'admin123' : 'student123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(defaultPw, salt);
    await User.updateOne({ _id: u._id }, { password: hash });

    // Verify
    const ok = await bcrypt.compare(defaultPw, hash);
    console.log(`${ok ? '✅' : '❌'} ${u.name} (${u.email}) → ${defaultPw}`);
  }

  console.log('\n🎉 All passwords fixed!');
  await mongoose.disconnect();
  process.exit(0);
}

run();
