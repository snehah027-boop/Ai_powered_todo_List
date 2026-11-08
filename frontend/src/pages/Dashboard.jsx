import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { 
  CheckCircle, 
  Clock, 
  ListTodo, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Sparkles,
  Award,
  Check
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [todos, setTodos] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const localDate = new Date();
    const offset = localDate.getTimezoneOffset();
    const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  });

  const handleToggleComplete = async (todo) => {
    try {
      const updatedStatus = !todo.completed;
      const res = await api.put(`/todos/${todo._id}`, {
        completed: updatedStatus,
      });

      if (res.data.success) {
        setTodos(prev => prev.map(t => t._id === todo._id ? res.data.todo : t));
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [todosRes, diariesRes] = await Promise.all([
          api.get('/todos'),
          api.get('/diary')
        ]);
        setTodos(todosRes.data.todos || []);
        setDiaries(diariesRes.data.entries || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute metrics
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const productivityPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart 1: Priority Distribution (Doughnut)
  const priorityCounts = todos.reduce(
    (acc, todo) => {
      acc[todo.priority] = (acc[todo.priority] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 }
  );

  const doughnutData = {
    labels: ['High Priority', 'Medium Priority', 'Low Priority'],
    datasets: [
      {
        data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low],
        backgroundColor: [
          'rgba(239, 68, 68, 0.85)',   // Red
          'rgba(245, 158, 11, 0.85)',  // Amber
          'rgba(59, 130, 246, 0.85)',  // Blue
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'currentColor',
          font: { family: 'inherit', size: 11 }
        }
      }
    }
  };

  // Chart 2: Task completions over the last 7 days (Line)
  const getLineChartData = () => {
    const days = [];
    const completedCounts = [];
    const createdCounts = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      // Label format (e.g. "Jul 9")
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push(label);

      // Completed on this day
      const completedOnDay = todos.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        return t.completedAt.split('T')[0] === dateString;
      }).length;
      completedCounts.push(completedOnDay);

      // Created on this day
      const createdOnDay = todos.filter(t => {
        return t.createdAt.split('T')[0] === dateString;
      }).length;
      createdCounts.push(createdOnDay);
    }

    return {
      labels: days,
      datasets: [
        {
          label: 'Completed Tasks',
          data: completedCounts,
          borderColor: 'rgb(79, 70, 229)', // Indigo
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Created Tasks',
          data: createdCounts,
          borderColor: 'rgb(147, 51, 234)', // Purple
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.35,
          fill: true,
        }
      ],
    };
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'currentColor', font: { family: 'inherit', size: 12 } }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: 'currentColor', stepSize: 1 }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'currentColor' }
      }
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const totalDays = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const dayCells = [];

    // Empty spaces for previous month's trailing days
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${year}-${month}-${dayStr}`;

      // Check if there is a diary entry on this date
      const hasDiary = diaries.some(entry => entry.date === dateString);

      // Check if there are tasks due on this date
      const hasTasksDue = todos.some(todo => {
        if (!todo.dueDate) return false;
        return todo.dueDate.split('T')[0] === dateString;
      });

      // Check if it's today
      const isToday = new Date().toISOString().split('T')[0] === dateString;

      // Check if this day is selected
      const isSelected = selectedDateStr === dateString;

      dayCells.push(
        <button 
          key={`day-${day}`}
          type="button"
          onClick={() => setSelectedDateStr(dateString)}
          className={`group relative flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-all cursor-pointer focus:outline-none ${
            isToday 
              ? 'bg-indigo-600 text-white shadow-md glow-indigo' 
              : isSelected
              ? 'border-2 border-indigo-500 bg-indigo-50 text-indigo-705 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
          } ${isSelected && isToday ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
        >
          <span>{day}</span>
          
          {/* Indicators for tasks or diaries */}
          <div className="absolute bottom-1 flex gap-1 justify-center">
            {hasDiary && (
              <span className={`h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-purple-500'}`} title="Diary written"></span>
            )}
            {hasTasksDue && (
              <span className={`h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-amber-500'}`} title="Tasks due"></span>
            )}
          </div>
        </button>
      );
    }

    return dayCells;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Welcome banner */}
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl dark:from-slate-900 dark:to-indigo-950 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              Sync Your Mind & Workflow <Sparkles className="h-6 w-6 text-indigo-400" />
            </h1>
            <p className="mt-2 text-slate-300 max-w-xl text-sm md:text-base">
              Track your daily tasks, write down your thoughts, and unlock AI-powered insights to balance your productivity and stress.
            </p>
          </div>
          <Link
            to="/ai-analysis"
            className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-900/30 dark:shadow-none hover:-translate-y-0.5 transition-all text-sm shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Analyze My Day
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <ListTodo className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalTasks}</h3>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Tasks</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{completedTasks}</h3>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Tasks</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{pendingTasks}</h3>
          </div>
        </div>

        {/* Productivity Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Productivity Ratio</p>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{productivityPercentage}%</h3>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-500" 
                  style={{ width: `${productivityPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Charts & Side Dashboard Panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Productivity Line Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Performance Analytics <Award className="h-5 w-5 text-indigo-500" />
            </h3>
            <p className="text-xs text-slate-500">Track task creations vs task completions over the past 7 days</p>
          </div>
          
          <div className="h-64 md:h-72 w-full">
            {totalTasks > 0 ? (
              <Line data={getLineChartData()} options={lineOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                No tasks available. Add some tasks to see performance analytics.
              </div>
            )}
          </div>
        </div>

        {/* Priority Doughnut Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Task Priority Mix</h3>
            <p className="text-xs text-slate-500">Distribution of priorities across all scheduled items</p>
          </div>
          
          <div className="h-60 w-full relative">
            {totalTasks > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                No priority analytics available.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Diary Logs Calendar & Quick Entries Info */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Month Calendar Panel */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" />
              Calendar Sync
            </h3>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handlePrevMonth} 
                className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-250">
                {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <button 
                onClick={handleNextMonth} 
                className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center justify-items-center">
            {renderCalendarDays()}
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span> Diary entry
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Task due
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-lg bg-indigo-600"></span> Today
            </span>
          </div>
        </div>

        {/* Selected Date Details Panel (Diaries + Tasks) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between animate-fade-in" key={selectedDateStr}>
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                Details for {new Date(selectedDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-slate-500">Logs and tasks scheduled for this calendar date</p>
            </div>
            <Link
              to="/ai-analysis"
              className="text-xs font-semibold text-indigo-605 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 bg-indigo-550/10 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-xl flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" /> Analyze Day
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 flex-grow">
            
            {/* Left Column: Diary Entry */}
            <div className="flex flex-col justify-between min-h-[220px]">
              <div>
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <BookOpen className="h-4 w-4 text-purple-500" /> Diary Entry
                </h4>

                {(() => {
                  const entry = diaries.find(d => d.date === selectedDateStr);
                  if (entry) {
                    return (
                      <div className="space-y-2">
                        {entry.title && (
                          <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {entry.title}
                          </h5>
                        )}
                        <p 
                          className="text-xs text-slate-600 dark:text-slate-400 line-clamp-6 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: entry.content }}
                        ></p>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl h-36">
                      <BookOpen className="h-7 w-7 text-slate-350 stroke-1 mb-1.5" />
                      <p className="text-xs">No entry saved for this date.</p>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4">
                <Link
                  to={`/diary`}
                  className="inline-flex w-full justify-center items-center rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-650 py-2.5 text-xs font-bold dark:bg-purple-950/20 dark:text-purple-400 transition-colors"
                >
                  {diaries.some(d => d.date === selectedDateStr) ? 'Edit Diary Log' : 'Write Diary Log'}
                </Link>
              </div>
            </div>

            {/* Right Column: Tasks Due */}
            <div className="flex flex-col justify-between min-h-[220px] border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6 pt-4 md:pt-0">
              <div>
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <ListTodo className="h-4 w-4 text-amber-550 text-amber-500" /> Scheduled Tasks
                </h4>

                {(() => {
                  const dayTasks = todos.filter(t => t.dueDate && t.dueDate.split('T')[0] === selectedDateStr);
                  if (dayTasks.length > 0) {
                    return (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {dayTasks.map(todo => (
                          <div 
                            key={todo._id}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
                          >
                            <button
                              onClick={() => handleToggleComplete(todo)}
                              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer ${
                                todo.completed
                                  ? 'bg-green-500 border-green-600 text-white'
                                  : 'border-slate-300 hover:border-indigo-500 dark:border-slate-750'
                              }`}
                            >
                              {todo.completed && <Check className="h-3 w-3 font-bold" />}
                            </button>
                            <span className={`text-xs truncate font-medium ${
                              todo.completed ? 'line-through text-slate-450 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                            }`}>
                              {todo.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl h-36">
                      <ListTodo className="h-7 w-7 text-slate-350 stroke-1 mb-1.5" />
                      <p className="text-xs">No tasks due on this date.</p>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-4">
                <Link
                  to="/todos"
                  className="inline-flex w-full justify-center items-center rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 py-2.5 text-xs font-bold dark:bg-amber-950/20 dark:text-amber-400 transition-colors"
                >
                  Manage Tasks
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
