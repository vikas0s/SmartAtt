const mongoose = require('mongoose');

const faceDataSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  descriptors: {
    type: [[Number]], // Array of arrays, each containing 128 floats
    required: true,
    validate: {
      validator: function (v) {
        return v.length >= 1 && v.every(d => d.length === 128);
      },
      message: 'Each descriptor must contain exactly 128 float values',
    },
  },
  capturedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FaceData', faceDataSchema);
