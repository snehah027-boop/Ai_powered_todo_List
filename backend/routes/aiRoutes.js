const express = require('express');
const router = express.Router();
const { analyzeDayData } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, analyzeDayData);

module.exports = router;
