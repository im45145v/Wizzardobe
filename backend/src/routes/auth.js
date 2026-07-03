const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, refresh, getProfile, updateProfile, updateApiKey, onboarding } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Strict rate limiter for authentication endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/api-key', protect, updateApiKey);
router.post('/onboarding', protect, onboarding);

module.exports = router;
