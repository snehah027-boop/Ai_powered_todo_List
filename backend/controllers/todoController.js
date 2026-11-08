const Todo = require('../models/Todo');

// @desc    Get all todos with searching, filtering, and sorting
// @route   GET /api/todos
// @access  Private
const getTodos = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { search, completed, priority, category, sortBy, sortOrder } = req.query;

    // Build query object
    let query = { userId };

    // Search filter (title or description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Completed filter
    if (completed === 'true') {
      query.completed = true;
    } else if (completed === 'false') {
      query.completed = false;
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    // Category filter
    if (category) {
      query.category = { $regex: `^${category}$`, $options: 'i' }; // case-insensitive match
    }

    // Sorting
    let sort = {};
    const order = sortOrder === 'desc' ? -1 : 1;

    if (sortBy === 'dueDate') {
      // Put null due dates at the end
      sort = { dueDate: order, createdAt: -1 };
    } else if (sortBy === 'priority') {
      // Custom priority sorting order (high -> medium -> low)
      // Mongoose doesn't support custom sort order easily via simple string queries, 
      // so we can perform standard sorting in Node or map values.
      // For database sorting, we sort by priority field alphabetically (high, medium, low) or use createdAt.
      // High to Low alphabetically: medium, low, high. That doesn't work.
      // Let's implement custom sorting in JS if sortBy is 'priority', otherwise sort in DB
      sort = { createdAt: -1 }; // default sorting
    } else {
      sort = { createdAt: order }; // default sorting
    }

    let todos = await Todo.find(query).sort(sort);

    // Apply custom priority sorting in JS if selected
    if (sortBy === 'priority') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      todos.sort((a, b) => {
        const weightA = priorityWeights[a.priority] || 0;
        const weightB = priorityWeights[b.priority] || 0;
        return sortOrder === 'desc' ? weightB - weightA : weightA - weightB;
      });
    }

    res.json({
      success: true,
      count: todos.length,
      todos,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a todo
// @route   POST /api/todos
// @access  Private
const createTodo = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, category } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Title is required');
    }

    const todo = await Todo.create({
      userId: req.user._id,
      title,
      description,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      category: category || 'General',
    });

    res.status(201).json({
      success: true,
      todo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a todo
// @route   PUT /api/todos/:id
// @access  Private
const updateTodo = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, category, completed } = req.body;

    let todo = await Todo.findById(req.params.id);

    if (!todo) {
      res.status(404);
      throw new Error('Todo not found');
    }

    // Verify ownership
    if (todo.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to access this todo');
    }

    // Update fields
    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (dueDate !== undefined) todo.dueDate = dueDate || null;
    if (priority !== undefined) todo.priority = priority;
    if (category !== undefined) todo.category = category;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();

    res.json({
      success: true,
      todo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      res.status(404);
      throw new Error('Todo not found');
    }

    // Verify ownership
    if (todo.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to access this todo');
    }

    await todo.deleteOne();

    res.json({
      success: true,
      message: 'Todo removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
};
