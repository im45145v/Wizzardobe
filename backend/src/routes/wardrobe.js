const express = require('express');
const router = express.Router();
const { addCloth, getCloths, getCloth, updateCloth, deleteCloth, markWorn, markStatus } = require('../controllers/wardrobeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', getCloths);
router.post('/', upload.single('image'), addCloth);
router.get('/:id', getCloth);
router.put('/:id', updateCloth);
router.delete('/:id', deleteCloth);
router.post('/:id/worn', markWorn);
router.put('/:id/status', markStatus);

module.exports = router;
