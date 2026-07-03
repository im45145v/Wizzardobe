const express = require('express');
const router = express.Router();
const { getDashboardStats, getMostWorn, getLeastWorn, getCostPerWear, getOutfitVariety, getStylePersona } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/most-worn', getMostWorn);
router.get('/least-worn', getLeastWorn);
router.get('/cost-per-wear', getCostPerWear);
router.get('/outfit-variety', getOutfitVariety);
router.get('/style-persona', getStylePersona);

module.exports = router;
