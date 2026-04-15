const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/lms_db_placeholder').then(async () => {
  await User.deleteMany({ username: { $in: ['admin', 'student'] } });
  const admin = new User({ username: 'admin', password: 'password123', role: 'admin' });
  const student = new User({ username: 'student', password: 'password123', role: 'student' });
  await admin.save();
  await student.save();
  console.log('Successfully seeded 1 admin and 1 student account!');
  process.exit(0);
}).catch(e => console.error(e));
