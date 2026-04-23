const express = require('express');
const router = express.Router();
const {
  markAttendance, getStudentAttendance, getSessionAttendance,
  getAttendanceReport, getAnalytics, getStudentsWithAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mark', protect, markAttendance);
router.get('/student/:id', protect, getStudentAttendance);
router.get('/session/:id', protect, getSessionAttendance);
router.get('/report', protect, authorize('admin'), getAttendanceReport);
router.get('/analytics', protect, getAnalytics);
router.get('/students', protect, authorize('admin'), getStudentsWithAttendance);

module.exports = router;
