const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: [true, 'Class ID is required'],
    trim: true,
  },
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  qrToken: {
    type: String,
    unique: true,
    required: true,
  },
  qrCodeImage: {
    type: String, // base64 encoded QR code image
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  markedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  department: {
    type: String,
    trim: true,
  },
  semester: {
    type: Number,
  },
}, {
  timestamps: true,
});

// Index for active session queries
sessionSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
