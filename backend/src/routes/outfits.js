const express = require('express');
const router = express.Router();
const { suggest, getSuggestions, rateSuggestion, wearSuggestion, saveOutfit, getOutfits, judgeOutfit } = require('../controllers/outfitController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/suggest', suggest);
router.get('/suggestions', getSuggestions);
router.put('/suggestions/:id/rate', rateSuggestion);
router.post('/suggestions/:id/wear', wearSuggestion);
router.get('/', getOutfits);
router.post('/', saveOutfit);
router.post('/judge', upload.single('image'), judgeOutfit);

module.exports = router;
