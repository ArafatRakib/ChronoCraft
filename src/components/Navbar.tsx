import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles, 
  Sun, 
  Flame, 
  Mic, 
  MicOff,
  SlidersHorizontal,
  Settings2
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  stopwatchCount: number;
  runningStopwatchCount: number;
  timerCount: number;
  runningTimerCount: number;
  intervalCount?: number;
  runningIntervalCount?: number;
  onOpenCreate: (type?: 'stopwatch' | 'timer' | 'interval') => void;
  onStartAll: () => void;
  onPauseAll: () => void;
  onResetAll: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenPresets: () => void;
  wakeLockActive?: boolean;
  onToggleWakeLock?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  stopwatchCount,
  runningStopwatchCount,
  timerCount,
  runningTimerCount,
  intervalCount = 0,
  runningIntervalCount = 0,
  onOpenCreate,
  onStartAll,
  onPauseAll,
  onResetAll,
  isMuted,
  onToggleMute,
  onOpenPresets,
  wakeLockActive = false,
  onToggleWakeLock,
  voiceEnabled = true,
  onToggleVoice,
}) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalCount = stopwatchCount + timerCount + intervalCount;
  const totalRunning = runningStopwatchCount + runningTimerCount + runningIntervalCount;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Single Row Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Brand Zone (Single clean element with running badge) */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/30 shrink-0">
              <TimerIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                ChronoCraft
              </span>
              {totalRunning > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{totalRunning}</span>
                  <span className="hidden md:inline">running</span>
                </span>
              )}
            </div>
          </div>

          {/* Desktop Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <button
              onClick={() => onSelectTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({totalCount})</span>
            </button>

            <button
              onClick={() => onSelectTab('stopwatches')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'stopwatches'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Stopwatches ({stopwatchCount})</span>
              {runningStopwatchCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('timers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'timers'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TimerIcon className="w-3.5 h-3.5" />
              <span>Timers ({timerCount})</span>
              {runningTimerCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('intervals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'intervals'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>HIIT ({intervalCount})</span>
              {runningIntervalCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Action Zone (Presets, Tools Dropdown, Add Action) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Presets Library Button */}
            <button
              onClick={onOpenPresets}
              className="p-2 sm:py-2 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Preset Library"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Presets</span>
            </button>

            {/* Quick Audio Mute Toggle */}
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl transition-colors border text-xs font-semibold flex items-center justify-center cursor-pointer ${
                isMuted
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isMuted ? 'Sound Muted (Click to enable)' : 'Sound Active (Click to mute)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Unified Tools & Batch Actions Popover Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                  wakeLockActive || showToolsMenu
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Tools, Cues & Batch Actions"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95">
                  {/* Preferences Group */}
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Preferences & Assist
                    </div>

                    {/* Wake Lock */}
                    {onToggleWakeLock && (
                      <button
                        onClick={onToggleWakeLock}
                        className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sun className={`w-4 h-4 ${wakeLockActive ? 'text-amber-500 animate-spin-slow' : 'text-slate-400'}`} />
                          <span>Screen Wake Lock</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${wakeLockActive ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'text-slate-400'}`}>
                          {wakeLockActive ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    )}

                    {/* Voice Coach */}
                    {onToggleVoice && (
                      <button
                        onClick={onToggleVoice}
                        className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {voiceEnabled ? <Mic className="w-4 h-4 text-indigo-500" /> : <MicOff className="w-4 h-4 text-slate-400" />}
                          <span>Voice Coach</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${voiceEnabled ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'text-slate-400'}`}>
                          {voiceEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Batch Controls Group */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Batch Controls
                    </div>

                    <button
                      onClick={() => {
                        onStartAll();
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                      <span>Start All Running</span>
                    </button>

                    <button
                      onClick={() => {
                        onPauseAll();
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Pause All</span>
                    </button>

                    <button
                      onClick={() => {
                        onResetAll();
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reset All</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Add Button */}
            <button
              onClick={() => onOpenCreate(activeTab === 'stopwatches' ? 'stopwatch' : activeTab === 'intervals' ? 'interval' : 'timer')}
              className="py-2 px-3 sm:py-2 sm:px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-500/25 transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Add New Clock"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Mobile View Tab Switcher Sub-bar */}
        <div className="flex items-center md:hidden py-1.5 border-t border-slate-200/60 dark:border-slate-800 text-xs font-semibold gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onSelectTab('all')}
            className={`py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>All ({totalCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('stopwatches')}
            className={`py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'stopwatches'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Stopwatches ({stopwatchCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('timers')}
            className={`py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'timers'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TimerIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Timers ({timerCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('intervals')}
            className={`py-1 px-2.5 rounded-lg flex items-center justify-center gap-1 shrink-0 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'intervals'
                ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>HIIT ({intervalCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
