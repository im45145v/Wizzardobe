const express = require('express');
const router = express.Router();
const { packTrip, buildCapsule, getStylePersona, getSeasonalRefresh } = require('../controllers/stylistController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/pack-trip', packTrip);
router.post('/capsule', buildCapsule);
router.get('/style-persona', getStylePersona);
router.get('/seasonal-refresh', getSeasonalRefresh);

module.exports = router;
