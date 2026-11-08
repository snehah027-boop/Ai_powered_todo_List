import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { 
  Calendar as CalendarIcon, 
  Save, 
  Trash2, 
  AlertCircle, 
  Check, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

const Diary = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today in YYYY-MM-DD
    const localDate = new Date();
    const offset = localDate.getTimezoneOffset();
    const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  });
  
  const [title, setTitle] = useState('');
  const [editorHtml, setEditorHtml] = useState('');
  const [diaryId, setDiaryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error', 'unsaved'
  const [error, setError] = useState('');
  
  // Reference to contenteditable div
  const editorRef = useRef(null);

  const fetchEntry = async (date) => {
    try {
      setLoading(true);
      setError('');
      setSaveStatus('');
      
      const res = await api.get(`/diary/date/${date}`);
      const entry = res.data.diary;

      if (entry) {
        setDiaryId(entry._id);
        setTitle(entry.title || '');
        setEditorHtml(entry.content || '');
        if (editorRef.current) {
          editorRef.current.innerHTML = entry.content || '';
        }
      } else {
        setDiaryId(null);
        setTitle('');
        setEditorHtml('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      }
    } catch (err) {
      console.error('Error fetching diary entry:', err);
      setError('Could not load diary entry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntry(selectedDate);
  }, [selectedDate]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setEditorHtml(editorRef.current.innerHTML);
      setSaveStatus('unsaved');
    }
  };

  // Rich Text Editor Commands using execCommand (standard browser support)
  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleEditorInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleSave = async () => {
    if (!editorHtml.trim() || editorHtml === '<br>') {
      setError('Cannot save empty diary entry.');
      return;
    }

    try {
      setSaveStatus('saving');
      setError('');

      const res = await api.post('/diary', {
        date: selectedDate,
        title,
        content: editorHtml,
      });

      if (res.data.success) {
        setDiaryId(res.data.diary._id);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error saving entry:', err);
      setError('Failed to save entry.');
      setSaveStatus('error');
    }
  };

  const handleDelete = async () => {
    if (!diaryId) return;
    if (!window.confirm('Are you sure you want to delete this diary entry?')) return;

    try {
      setLoading(true);
      const res = await api.delete(`/diary/${diaryId}`);
      if (res.data.success) {
        setDiaryId(null);
        setTitle('');
        setEditorHtml('');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
        setSaveStatus('deleted');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            My Daily Diary <Sparkles className="h-5 w-5 text-purple-500" />
          </h1>
          <p className="text-slate-500 text-sm mt-1">Reflect on your life, mood, and productivity.</p>
        </div>

        {/* Date Selection Panel */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CalendarIcon className="h-4.5 w-4.5 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]} // Can't write diaries for the future
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none dark:text-slate-200"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Editor Workspace */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Editor Toolbar */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => executeCommand('bold')}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-250 transition-colors"
              title="Bold"
            >
              <Bold className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => executeCommand('italic')}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-250 transition-colors"
              title="Italic"
            >
              <Italic className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => executeCommand('underline')}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-250 transition-colors"
              title="Underline"
            >
              <Underline className="h-4.5 w-4.5" />
            </button>
            
            <span className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1"></span>

            <button
              onClick={() => executeCommand('insertUnorderedList')}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-250 transition-colors"
              title="Bullet List"
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => executeCommand('insertOrderedList')}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-250 transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => executeCommand('removeFormat')}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-250 transition-colors"
              title="Clear formatting"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Save Status Indicators */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1.5 font-medium">
                <Check className="h-4 w-4" /> Saved Successfully
              </span>
            )}
            {saveStatus === 'deleted' && (
              <span className="text-xs text-red-500 flex items-center gap-1.5">
                Entry deleted
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-xs text-amber-600 font-semibold">
                Unsaved changes
              </span>
            )}
          </div>
        </div>

        {/* Title Input area */}
        <input
          type="text"
          placeholder="Give your day a title (e.g. A roller coaster ride, Productive sprints)..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaveStatus('unsaved');
          }}
          disabled={loading}
          className="w-full px-6 py-4 text-lg font-bold border-none outline-none text-slate-800 bg-transparent dark:text-white placeholder-slate-400 focus:ring-0"
        />
        
        <hr className="border-slate-100 dark:border-slate-800/80 mx-6" />

        {/* Edit container (contenteditable) */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-500 border-t-transparent"></div>
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable={true}
            onInput={handleEditorInput}
            className="flex-grow px-6 py-4 outline-none text-slate-700 bg-transparent dark:text-slate-350 prose dark:prose-invert max-w-none text-sm md:text-base min-h-[300px] focus:ring-0"
            placeholder="Write your diary logs here. Describe what went well, what goals you accomplished, your feelings, and stress triggers..."
          />
        )}

      </div>

      {/* Editor Actions Bottom Buttons */}
      <div className="flex justify-end gap-3">
        {diaryId && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-2xl border border-red-200 text-red-650 px-5 py-2.5 text-sm font-semibold hover:bg-red-50 dark:border-red-950/40 dark:text-red-400 dark:hover:bg-red-950/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4.5 w-4.5" />
            Delete Entry
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={loading || saveStatus === 'saving'}
          className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-650 text-white px-6 py-2.5 text-sm font-bold hover:from-indigo-500 hover:to-purple-550 shadow-md shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
        >
          <Save className="h-4.5 w-4.5" />
          Save Diary Entry
        </button>
      </div>

    </div>
  );
};

export default Diary;
