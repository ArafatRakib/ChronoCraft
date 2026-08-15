import React, { useEffect, useState } from 'react';
import { loadSavedTheme, saveTheme } from '../utils/storage';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadSavedTheme());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 focus:outline-none flex items-center gap-2"
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold hidden md:inline">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold hidden md:inline">Light</span>
        </>
      )}
    </button>
  );
};
