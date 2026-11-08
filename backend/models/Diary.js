const mongoose = require('mongoose');

const DiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: [true, 'Please specify a date (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Please add content to your diary'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index so each user can have only one diary entry per day
DiarySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Diary', DiarySchema);
