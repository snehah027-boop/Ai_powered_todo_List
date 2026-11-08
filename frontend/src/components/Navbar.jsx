import React from 'react';
import { Menu, LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/70 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          type="button"
          className="inline-flex rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-6 w-6 text-slate-600 dark:text-slate-300" />
        </button>
        
        <div className="hidden items-center gap-2 md:flex">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold tracking-wide text-gradient-primary">
            AI Mind & Productivity Sync
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {user.username}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
            
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
              {user.username.substring(0, 2).toUpperCase()}
            </div>

            <button
              onClick={logout}
              className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
