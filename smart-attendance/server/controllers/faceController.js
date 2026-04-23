const FaceData = require('../models/FaceData');
const User = require('../models/User');
const { findBestMatch } = require('../utils/faceUtils');

// @desc    Register face data for a student
// @route   POST /api/face/register
// @access  Private
const registerFace = async (req, res, next) => {
  try {
    const { studentId, descriptors } = req.body;

    if (!studentId || !descriptors || !Array.isArray(descriptors)) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and descriptors array are required',
      });
    }

    // Validate descriptors format
    if (!descriptors.every(d => Array.isArray(d) && d.length === 128)) {
      return res.status(400).json({
        success: false,
        message: 'Each descriptor must be an array of 128 float values',
      });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Upsert face data
    let faceData = await FaceData.findOne({ studentId });
    if (faceData) {
      faceData.descriptors = descriptors;
      faceData.capturedAt = Date.now();
      await faceData.save();
    } else {
      faceData = await FaceData.create({
        studentId,
        descriptors,
        capturedAt: Date.now(),
      });
    }

    // Update user faceRegistered flag (use updateOne to bypass pre-save hook)
    await User.updateOne({ _id: studentId }, { faceRegistered: true });

    res.status(200).json({
      success: true,
      message: 'Face data registered successfully',
      data: {
        studentId: faceData.studentId,
        samplesCount: faceData.descriptors.length,
        capturedAt: faceData.capturedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Recognize a face from descriptor
// @route   POST /api/face/recognize
// @access  Private
const recognizeFace = async (req, res, next) => {
  try {
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        message: 'A valid 128-point face descriptor is required',
      });
    }

    // Get all stored face data
    const allFaceData = await FaceData.find({}).populate('studentId', 'name email enrollmentNumber');

    if (allFaceData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No face data registered in the system',
      });
    }

    const result = findBestMatch(descriptor, allFaceData);

    if (result.matched) {
      const student = await User.findById(result.studentId);
      return res.status(200).json({
        success: true,
        message: 'Face recognized',
        data: {
          matched: true,
          student: {
            _id: student._id,
            name: student.name,
            email: student.email,
            enrollmentNumber: student.enrollmentNumber,
          },
          confidence: result.confidence,
          distance: result.distance,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'No match found',
      data: {
        matched: false,
        distance: result.distance,
        confidence: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get face data for a student
// @route   GET /api/face/:studentId
// @access  Private
const getFaceData = async (req, res, next) => {
  try {
    const faceData = await FaceData.findOne({ studentId: req.params.studentId });

    if (!faceData) {
      return res.status(404).json({
        success: false,
        message: 'No face data found for this student',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        studentId: faceData.studentId,
        samplesCount: faceData.descriptors.length,
        capturedAt: faceData.capturedAt,
        updatedAt: faceData.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete face data for a student
// @route   DELETE /api/face/:studentId
// @access  Private (Admin)
const deleteFaceData = async (req, res, next) => {
  try {
    const faceData = await FaceData.findOneAndDelete({ studentId: req.params.studentId });

    if (!faceData) {
      return res.status(404).json({
        success: false,
        message: 'No face data found for this student',
      });
    }

    // Update user flag
    await User.findByIdAndUpdate(req.params.studentId, { faceRegistered: false });

    res.status(200).json({
      success: true,
      message: 'Face data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerFace,
  recognizeFace,
  getFaceData,
  deleteFaceData,
};
