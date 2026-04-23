const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { generateQRToken, generateQRImage } = require('../utils/qrUtils');

// @desc    Create a new attendance session
// @route   POST /api/session/create
// @access  Private (Admin)
const createSession = async (req, res, next) => {
  try {
    const { classId, subjectName, department, semester } = req.body;

    if (!classId || !subjectName) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and subject name are required',
      });
    }

    const qrToken = generateQRToken();
    const expiryMinutes = parseInt(process.env.QR_EXPIRY_MINUTES) || 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const qrData = {
      sessionToken: qrToken,
      classId,
      subjectName,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const qrCodeImage = await generateQRImage(qrData);

    const session = await Session.create({
      classId,
      subjectName,
      createdBy: req.user._id,
      qrToken,
      qrCodeImage,
      expiresAt,
      department,
      semester,
    });

    // Emit socket event for new session
    const io = req.app.get('io');
    if (io) {
      io.emit('session:created', {
        sessionId: session._id,
        classId,
        subjectName,
        expiresAt,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session details
// @route   GET /api/session/:sessionId
// @access  Private
const getSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('createdBy', 'name email')
      .populate('markedStudents', 'name email enrollmentNumber');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Scan QR code and mark attendance
// @route   POST /api/session/scan
// @access  Private (Student)
const scanQR = async (req, res, next) => {
  try {
    const { qrData, deviceInfo } = req.body;
    const studentId = req.user._id;

    if (!qrData || !qrData.sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code data',
      });
    }

    // Find session by QR token
    const session = await Session.findOne({ qrToken: qrData.sessionToken });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Check if session is active
    if (!session.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Session has ended',
      });
    }

    // Check if QR has expired
    if (new Date() > new Date(session.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'QR code has expired',
      });
    }

    // Check if student already marked
    if (session.markedStudents.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session',
      });
    }

    // Mark attendance
    const attendance = await Attendance.create({
      studentId,
      sessionId: session._id,
      method: 'qr',
      deviceInfo: deviceInfo || '',
      status: 'present',
    });

    // Add student to marked list
    session.markedStudents.push(studentId);
    await session.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:marked', {
        studentName: req.user.name,
        method: 'qr',
        sessionId: session._id,
        subjectName: session.subjectName,
        time: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully via QR code',
      data: attendance,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session',
      });
    }
    next(error);
  }
};

// @desc    Get all active sessions
// @route   GET /api/session/active
// @access  Private
const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End a session
// @route   POST /api/session/end/:id
// @access  Private (Admin)
const endSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    session.isActive = false;
    await session.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('session:ended', {
        sessionId: session._id,
        subjectName: session.subjectName,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sessions (with pagination)
// @route   GET /api/session/all
// @access  Private (Admin)
const getAllSessions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Session.countDocuments();
    const sessions = await Session.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  getSession,
  scanQR,
  getActiveSessions,
  endSession,
  getAllSessions,
};
