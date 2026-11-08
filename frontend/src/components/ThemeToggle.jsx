import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:focus:ring-slate-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-200 hover:rotate-45" />
      )}
    </button>
  );
};

export default ThemeToggle;
