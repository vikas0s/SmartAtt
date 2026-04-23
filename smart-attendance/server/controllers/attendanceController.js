const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');

// @desc    Mark attendance (face or QR)
// @route   POST /api/attendance/mark
// @access  Private
const markAttendance = async (req, res, next) => {
  try {
    const { studentId, sessionId, method, deviceInfo } = req.body;

    // Validate session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (!session.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Session is no longer active',
      });
    }

    // Check for duplicate attendance
    const existing = await Attendance.findOne({ studentId, sessionId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session',
      });
    }

    const attendance = await Attendance.create({
      studentId,
      sessionId,
      method,
      deviceInfo: deviceInfo || '',
      status: 'present',
    });

    // Add student to session's marked list
    if (!session.markedStudents.includes(studentId)) {
      session.markedStudents.push(studentId);
      await session.save();
    }

    // Emit socket event
    const student = await User.findById(studentId);
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:marked', {
        studentName: student ? student.name : 'Unknown',
        enrollmentNumber: student ? student.enrollmentNumber : '',
        method,
        sessionId,
        subjectName: session.subjectName,
        time: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      message: `Attendance marked via ${method}`,
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

// @desc    Get attendance for a student
// @route   GET /api/attendance/student/:id
// @access  Private
const getStudentAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ studentId: req.params.id })
      .populate('sessionId', 'classId subjectName createdAt')
      .sort({ markedAt: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance for a session
// @route   GET /api/attendance/session/:id
// @access  Private
const getSessionAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ sessionId: req.params.id })
      .populate('studentId', 'name email enrollmentNumber department semester')
      .sort({ markedAt: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance report with filters
// @route   GET /api/attendance/report
// @access  Private (Admin)
const getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, studentId, subjectName, department } = req.query;

    let filter = {};

    if (startDate || endDate) {
      filter.markedAt = {};
      if (startDate) filter.markedAt.$gte = new Date(startDate);
      if (endDate) filter.markedAt.$lte = new Date(endDate);
    }

    if (studentId) filter.studentId = studentId;

    let attendance = await Attendance.find(filter)
      .populate('studentId', 'name email enrollmentNumber department semester')
      .populate('sessionId', 'classId subjectName department createdAt')
      .sort({ markedAt: -1 });

    // Filter by subject if provided
    if (subjectName) {
      attendance = attendance.filter(a =>
        a.sessionId && a.sessionId.subjectName.toLowerCase().includes(subjectName.toLowerCase())
      );
    }

    // Filter by department if provided
    if (department) {
      attendance = attendance.filter(a =>
        a.studentId && a.studentId.department &&
        a.studentId.department.toLowerCase().includes(department.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance analytics
// @route   GET /api/attendance/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const { studentId } = req.query;

    // Total sessions
    const totalSessions = await Session.countDocuments();

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.countDocuments({
      markedAt: { $gte: today, $lt: tomorrow },
    });

    // Total students
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Active sessions
    const activeSessions = await Session.countDocuments({
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    let studentStats = null;
    if (studentId) {
      const studentAttendance = await Attendance.countDocuments({ studentId });
      const percentage = totalSessions > 0
        ? ((studentAttendance / totalSessions) * 100).toFixed(2)
        : 0;

      // Subject-wise breakdown
      const subjectWise = await Attendance.aggregate([
        { $match: { studentId: require('mongoose').Types.ObjectId.createFromHexString(studentId) } },
        { $lookup: { from: 'sessions', localField: 'sessionId', foreignField: '_id', as: 'session' } },
        { $unwind: '$session' },
        {
          $group: {
            _id: '$session.subjectName',
            attended: { $sum: 1 },
          },
        },
      ]);

      studentStats = {
        totalAttended: studentAttendance,
        totalSessions,
        percentage,
        subjectWise,
      };
    }

    // Method breakdown
    const faceCount = await Attendance.countDocuments({ method: 'face' });
    const qrCount = await Attendance.countDocuments({ method: 'qr' });

    // Weekly trend (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyTrend = await Attendance.aggregate([
      { $match: { markedAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$markedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        totalStudents,
        todayAttendance,
        activeSessions,
        methodBreakdown: { face: faceCount, qr: qrCount },
        weeklyTrend,
        studentStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students with attendance info
// @route   GET /api/attendance/students
// @access  Private (Admin)
const getStudentsWithAttendance = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const totalSessions = await Session.countDocuments();

    const studentsWithAttendance = await Promise.all(
      students.map(async (student) => {
        const attendanceCount = await Attendance.countDocuments({ studentId: student._id });
        const percentage = totalSessions > 0
          ? ((attendanceCount / totalSessions) * 100).toFixed(2)
          : 0;

        return {
          ...student.toObject(),
          attendanceCount,
          totalSessions,
          attendancePercentage: parseFloat(percentage),
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentsWithAttendance.length,
      data: studentsWithAttendance,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getStudentAttendance,
  getSessionAttendance,
  getAttendanceReport,
  getAnalytics,
  getStudentsWithAttendance,
};
