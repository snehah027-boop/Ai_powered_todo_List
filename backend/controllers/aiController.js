const Diary = require('../models/Diary');
const Todo = require('../models/Todo');
const aiService = require('../services/aiService');

// @desc    Analyze a day's productivity, sentiment, and stress level
// @route   POST /api/ai/analyze
// @access  Private
const analyzeDayData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let { date, diaryContent, completedTasks, pendingTasks } = req.body;

    // If data is not directly supplied by the client, fetch it from DB for the specified date
    if (!diaryContent && !completedTasks && !pendingTasks) {
      if (!date) {
        // Default to today in local timezone (YYYY-MM-DD)
        const localDate = new Date();
        const offset = localDate.getTimezoneOffset();
        const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
        date = adjustedDate.toISOString().split('T')[0];
      }

      // Fetch diary entry
      const diary = await Diary.findOne({ userId, date });
      diaryContent = diary ? diary.content : '';

      // Fetch tasks
      // Completed tasks on this date (or completed tasks in general for simplified dashboard view)
      // For a robust daily report, we fetch:
      // - Pending tasks
      // - Completed tasks
      const allTodos = await Todo.find({ userId });
      completedTasks = allTodos.filter(t => t.completed);
      pendingTasks = allTodos.filter(t => !t.completed);
    } else {
      // Ensure fallbacks for direct payload values
      diaryContent = diaryContent || '';
      completedTasks = completedTasks || [];
      pendingTasks = pendingTasks || [];
    }

    // Call FastAPI Service
    const aiResponse = await aiService.analyzeDay(diaryContent, completedTasks, pendingTasks);

    res.json({
      success: true,
      date: date || new Date().toISOString().split('T')[0],
      analysis: aiResponse,
    });
  } catch (error) {
    // If the FastAPI server is not running or fails, provide a descriptive error
    // with a fallback standard analysis so the UI doesn't crash
    console.error('AI Analysis Controller Error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'AI Service is temporarily unavailable. Please make sure the AI microservice is running.',
      fallback: {
        emotion: 'Neutral',
        sentiment: 'Neutral',
        stress_level: 'Low',
        productivity_score: 50,
        recommendation: 'The backend was unable to communicate with the FastAPI AI server. Please start the AI microservice to get actual AI-powered insights!'
      }
    });
  }
};

module.exports = {
  analyzeDayData,
};
