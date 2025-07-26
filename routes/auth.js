const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
router.post('/login', loginUser);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router; 