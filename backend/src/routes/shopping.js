const express = require('express');
const router = express.Router();
const { analyzeGaps, getWishlist, addToWishlist, updateWishlistItem, deleteWishlistItem } = require('../controllers/shoppingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/gaps', analyzeGaps);
router.get('/analyze', analyzeGaps);
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.put('/:id', updateWishlistItem);
router.delete('/:id', deleteWishlistItem);

module.exports = router;
