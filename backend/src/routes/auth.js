const express = require('express');
const router = express.Router();
const { register, login, refresh, getProfile, updateProfile, updateApiKey, onboarding } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/api-key', protect, updateApiKey);
router.post('/onboarding', protect, onboarding);

module.exports = router;
