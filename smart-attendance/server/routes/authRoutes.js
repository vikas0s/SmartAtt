const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, refreshAccessToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/refresh', refreshAccessToken);

module.exports = router;
