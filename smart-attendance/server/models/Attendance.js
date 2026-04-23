const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    enum: ['face', 'qr'],
    required: true,
  },
  deviceInfo: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'present',
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate attendance
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
