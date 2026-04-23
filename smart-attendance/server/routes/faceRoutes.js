const express = require('express');
const router = express.Router();
const { registerFace, recognizeFace, getFaceData, deleteFaceData } = require('../controllers/faceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', protect, registerFace);
router.post('/recognize', protect, recognizeFace);
router.get('/:studentId', protect, getFaceData);
router.delete('/:studentId', protect, authorize('admin'), deleteFaceData);

module.exports = router;
