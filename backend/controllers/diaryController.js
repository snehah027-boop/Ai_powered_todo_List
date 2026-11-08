const Diary = require('../models/Diary');

// @desc    Get all diary entries for current user
// @route   GET /api/diary
// @access  Private
const getDiaryEntries = async (req, res, next) => {
  try {
    const entries = await Diary.find({ userId: req.user._id }).sort({ date: -1 });
    res.json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get diary entry for a specific date (YYYY-MM-DD)
// @route   GET /api/diary/date/:date
// @access  Private
const getDiaryEntryByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400);
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    const diary = await Diary.findOne({ userId: req.user._id, date });

    res.json({
      success: true,
      diary, // returns null if no entry exists for this date
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update a diary entry for a date
// @route   POST /api/diary
// @access  Private
const createOrUpdateDiaryEntry = async (req, res, next) => {
  try {
    const { date, title, content } = req.body;

    if (!date || !content) {
      res.status(400);
      throw new Error('Date and content are required');
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400);
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    // Use findOneAndUpdate with upsert to avoid duplicate key errors and handle updates gracefully
    const diary = await Diary.findOneAndUpdate(
      { userId: req.user._id, date },
      { title: title || '', content },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      diary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a diary entry
// @route   DELETE /api/diary/:id
// @access  Private
const deleteDiaryEntry = async (req, res, next) => {
  try {
    const diary = await Diary.findById(req.params.id);

    if (!diary) {
      res.status(404);
      throw new Error('Diary entry not found');
    }

    // Verify ownership
    if (diary.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to access this diary entry');
    }

    await diary.deleteOne();

    res.json({
      success: true,
      message: 'Diary entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDiaryEntries,
  getDiaryEntryByDate,
  createOrUpdateDiaryEntry,
  deleteDiaryEntry,
};
