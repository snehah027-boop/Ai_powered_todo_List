const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to automatically set completedAt if completed is toggled
TodoSchema.pre('save', function(next) {
  if (this.isModified('completed')) {
    this.completedAt = this.completed ? new Date() : null;
  }
  next();
});

module.exports = mongoose.model('Todo', TodoSchema);
