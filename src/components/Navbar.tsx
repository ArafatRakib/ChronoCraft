import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { 
  Clock, 
  Timer as TimerIcon, 
  Layers, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  MoreVertical,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  stopwatchCount: number;
  runningStopwatchCount: number;
  timerCount: number;
  runningTimerCount: number;
  onOpenCreate: (type?: 'stopwatch' | 'timer') => void;
  onStartAll: () => void;
  onPauseAll: () => void;
  onResetAll: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenPresets: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  stopwatchCount,
  runningStopwatchCount,
  timerCount,
  runningTimerCount,
  onOpenCreate,
  onStartAll,
  onPauseAll,
  onResetAll,
  isMuted,
  onToggleMute,
  onOpenPresets,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const totalCount = stopwatchCount + timerCount;
  const totalRunning = runningStopwatchCount + runningTimerCount;

  return (
    <header 
      className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <TimerIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                  ChronoCraft
                </h1>
                {totalRunning > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{totalRunning}</span>
                    <span className="hidden sm:inline">Running</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Multi Stopwatch & Timer Suite
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => onSelectTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>All ({totalCount})</span>
            </button>

            <button
              onClick={() => onSelectTab('stopwatches')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'stopwatches'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Stopwatches ({stopwatchCount})</span>
              {runningStopwatchCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('timers')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'timers'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TimerIcon className="w-4 h-4" />
              <span>Timers ({timerCount})</span>
              {runningTimerCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Preset Library button */}
            <button
              onClick={onOpenPresets}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              title="Browse Preset Timers"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="hidden lg:inline">Presets</span>
            </button>

            {/* Mute Audio Toggle */}
            <button
              onClick={onToggleMute}
              className={`p-2 sm:p-2.5 rounded-xl transition-colors border text-xs font-semibold flex items-center gap-1.5 ${
                isMuted
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isMuted ? 'Sound Muted' : 'Sound Enabled'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Theme Toggle Component */}
            <ThemeToggle />

            {/* Bulk Actions Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                title="Batch Controls & Actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Batch Actions
                  </div>

                  <button
                    onClick={() => {
                      onStartAll();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                    <span>Start All</span>
                  </button>

                  <button
                    onClick={() => {
                      onPauseAll();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors"
                  >
                    <Pause className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Pause All</span>
                  </button>

                  <button
                    onClick={() => {
                      onResetAll();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <span>Reset All</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Add Button */}
            <button
              onClick={() => onOpenCreate(activeTab === 'stopwatches' ? 'stopwatch' : 'timer')}
              className="p-2 sm:py-2.5 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              title="Create New Clock"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Clock</span>
            </button>
          </div>
        </div>

        {/* Mobile View Tab Switcher Sub-bar */}
        <div className="flex items-center md:hidden py-1.5 border-t border-slate-200/60 dark:border-slate-800 text-xs font-semibold gap-1.5">
          <button
            onClick={() => onSelectTab('all')}
            className={`py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>All ({totalCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('stopwatches')}
            className={`py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 flex-1 whitespace-nowrap transition-colors ${
              activeTab === 'stopwatches'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Stopwatches ({stopwatchCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('timers')}
            className={`py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-colors ${
              activeTab === 'timers'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TimerIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Timers ({timerCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
