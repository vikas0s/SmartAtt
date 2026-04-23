const express = require('express');
const router = express.Router();
const {
  createSession, getSession, scanQR,
  getActiveSessions, endSession, getAllSessions,
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create', protect, authorize('admin'), createSession);
router.get('/active', protect, getActiveSessions);
router.get('/all', protect, authorize('admin'), getAllSessions);
router.get('/:sessionId', protect, getSession);
router.post('/scan', protect, scanQR);
router.post('/end/:id', protect, authorize('admin'), endSession);

module.exports = router;
