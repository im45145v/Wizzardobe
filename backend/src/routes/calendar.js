const express = require('express');
const router = express.Router();
const { getAuthUrl, handleCallback, getEvents, createOutfitEvent, getWeeklyPlan } = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');

router.get('/auth', protect, getAuthUrl);
router.get('/callback', handleCallback);
router.get('/events', protect, getEvents);
router.post('/events', protect, createOutfitEvent);
router.get('/weekly-plan', protect, getWeeklyPlan);

module.exports = router;
