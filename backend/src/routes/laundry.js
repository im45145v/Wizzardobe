const express = require('express');
const router = express.Router();
const { getLaundry, updateLaundry, getOverdue, getLaundryStats } = require('../controllers/laundryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Specific routes BEFORE parameterized routes
router.get('/overdue', getOverdue);
router.get('/stats', getLaundryStats);
router.get('/', getLaundry);
router.put('/:clothId', updateLaundry);

module.exports = router;
