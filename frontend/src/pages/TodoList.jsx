import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Calendar as CalendarIcon, 
  Check, 
  AlertCircle,
  FolderOpen,
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('General');
  const [editTodoId, setEditTodoId] = useState(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('all');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Categories list
  const categories = ['General', 'Work', 'Personal', 'Shopping', 'Health', 'Education'];

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterCompleted !== 'all') params.completed = filterCompleted;
      if (filterPriority) params.priority = filterPriority;
      if (filterCategory) params.category = filterCategory;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const res = await api.get('/todos', { params });
      setTodos(res.data.todos || []);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTodos();
    }, 300); // Debounce search changes

    return () => clearTimeout(delayDebounceFn);
  }, [search, filterCompleted, filterPriority, filterCategory, sortBy, sortOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    try {
      if (editTodoId) {
        // Update Todo
        const res = await api.put(`/todos/${editTodoId}`, {
          title,
          description,
          dueDate: dueDate || null,
          priority,
          category,
        });
        
        if (res.data.success) {
          setTodos(todos.map(t => t._id === editTodoId ? res.data.todo : t));
          resetForm();
        }
      } else {
        // Create Todo
        const res = await api.post('/todos', {
          title,
          description,
          dueDate: dueDate || null,
          priority,
          category,
        });
        
        if (res.data.success) {
          setTodos([res.data.todo, ...todos]);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Error saving todo:', err);
      setError('Failed to save task.');
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const updatedStatus = !todo.completed;
      const res = await api.put(`/todos/${todo._id}`, {
        completed: updatedStatus,
      });

      if (res.data.success) {
        setTodos(todos.map(t => t._id === todo._id ? res.data.todo : t));
        
        // Celebratory confetti on task completion
        if (updatedStatus) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#4f46e5', '#9333ea', '#10b981'],
          });
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleEditClick = (todo) => {
    setEditTodoId(todo._id);
    setTitle(todo.title);
    setDescription(todo.description || '');
    setDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '');
    setPriority(todo.priority);
    setCategory(todo.category || 'General');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const res = await api.delete(`/todos/${id}`);
      if (res.data.success) {
        setTodos(todos.filter(t => t._id !== id));
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const resetForm = () => {
    setEditTodoId(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setCategory('General');
    setError('');
  };

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          My Workspace Tasks
        </h1>
        <p className="text-slate-500 text-sm mt-1">Organize, update, and sort your schedules.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Task Form Panel */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm sticky top-20">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              {editTodoId ? 'Edit Task Info' : 'Create New Task'}
            </h3>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="Review code or buy groceries..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-350 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-medium">Notes / Details</label>
                <textarea
                  placeholder="Provide context or steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="mt-1 block w-full rounded-xl border border-slate-350 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-medium">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-350 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              {/* Priority Select */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-medium">Priority level</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['low', 'medium', 'high'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`rounded-xl py-2 text-xs font-bold border capitalize transition-all ${
                        priority === lvl
                          ? lvl === 'high'
                            ? 'bg-red-50 border-red-500 text-red-650 dark:bg-red-950/20 dark:text-red-400'
                            : lvl === 'medium'
                            ? 'bg-amber-50 border-amber-550 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-blue-550 bg-blue-50 border-blue-500 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400'
                          : 'border-slate-300 dark:border-slate-750 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-355 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900 transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 text-sm shadow-md transition-all cursor-pointer"
                >
                  {editTodoId ? 'Update Task' : 'Add Task'}
                </button>
                {editTodoId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>

        {/* Tasks List and Control Filters */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Dashboard */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
            
            {/* Search and Filters Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900 transition-colors"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Sort selector */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority Order</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                  title="Toggle sort direction"
                >
                  {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
                </button>
              </div>
            </div>

            {/* Quick Filters Options */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
              
              {/* Completed filter */}
              <div className="flex gap-1">
                {['all', 'false', 'true'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilterCompleted(item)}
                    className={`px-3 py-1 rounded-full border text-[11px] font-semibold capitalize transition-all ${
                      filterCompleted === item
                        ? 'bg-slate-800 border-slate-850 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    {item === 'all' ? 'All Tasks' : item === 'false' ? 'Pending' : 'Completed'}
                  </button>
                ))}
              </div>

              {/* Priority filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="">Any Priority</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              {/* Category filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="">Any Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

            </div>

          </div>

          {/* List display */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400"></div>
              </div>
            ) : todos.length > 0 ? (
              todos.map((todo) => {
                const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
                
                return (
                  <div
                    key={todo._id}
                    className={`group rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-start gap-4 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 ${
                      todo.completed ? 'opacity-70 dark:opacity-50' : ''
                    }`}
                  >
                    {/* Completion custom check box button */}
                    <button
                      onClick={() => handleToggleComplete(todo)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                        todo.completed
                          ? 'bg-green-500 border-green-600 text-white'
                          : 'border-slate-300 hover:border-indigo-500 dark:border-slate-700 dark:hover:border-indigo-400'
                      }`}
                    >
                      {todo.completed && <Check className="h-4.5 w-4.5 font-bold" />}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          todo.priority === 'high'
                            ? 'bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400'
                            : todo.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-blue-50 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400'
                        }`}>
                          {todo.priority}
                        </span>

                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {todo.category || 'General'}
                        </span>
                      </div>

                      <h3 className={`text-sm font-semibold text-slate-800 dark:text-slate-100 ${
                        todo.completed ? 'line-through text-slate-500 dark:text-slate-500' : ''
                      }`}>
                        {todo.title}
                      </h3>

                      {todo.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {todo.description}
                        </p>
                      )}

                      {/* Due date detail */}
                      {todo.dueDate && (
                        <div className="flex items-center gap-1 mt-2.5 text-[10px] font-medium">
                          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span className={`${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (Edit & Delete) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(todo)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        title="Edit Task"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(todo._id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl text-slate-400 gap-3">
                <FolderOpen className="h-10 w-10 stroke-1 text-slate-350" />
                <div className="text-center text-sm font-medium">
                  <p>No tasks matched your search or filters.</p>
                  <p className="text-xs text-slate-500 mt-1">Get started by creating one in the left panel!</p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default TodoList;
