const express = require('express');
const router = express.Router();
const {
  getDiaryEntries,
  getDiaryEntryByDate,
  createOrUpdateDiaryEntry,
  deleteDiaryEntry,
} = require('../controllers/diaryController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.route('/')
  .get(getDiaryEntries)
  .post(createOrUpdateDiaryEntry);

router.route('/date/:date')
  .get(getDiaryEntryByDate);

router.route('/:id')
  .delete(deleteDiaryEntry);

module.exports = router;
