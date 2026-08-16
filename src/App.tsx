/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { StopwatchItem, TimerItem, ActiveTab, ColorName, SoundPreset, TimerPreset } from './types';
import { loadStopwatches, saveStopwatches, loadTimers, saveTimers, getStopwatchElapsed, getTimerRemaining } from './utils/storage';
import { soundEngine } from './utils/audio';
import { Navbar } from './components/Navbar';
import { StopwatchCard } from './components/StopwatchCard';
import { TimerCard } from './components/TimerCard';
import { CreateModal } from './components/CreateModal';
import { FocusModal } from './components/FocusModal';
import { PresetsModal } from './components/PresetsModal';
import { EmptyState } from './components/EmptyState';
import { ColorFilterDropdown } from './components/ColorFilterDropdown';
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Timer as TimerIcon, 
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';

export default function App() {
  // Initialize state with stored items or initial helpful defaults
  const [stopwatches, setStopwatches] = useState<StopwatchItem[]>(() => {
    const saved = loadStopwatches();
    if (saved !== null) return saved;
    // Default initial stopwatch only on very first launch/install
    return [
      {
        id: 'sw-default-1',
        name: 'Work Sprint Stopwatch',
        color: 'emerald',
        isRunning: false,
        startedAt: null,
        accumulatedTime: 0,
        laps: [],
        createdAt: Date.now(),
      },
    ];
  });

  const [timers, setTimers] = useState<TimerItem[]>(() => {
    const saved = loadTimers();
    if (saved !== null) return saved;
    // Default initial timer only on very first launch/install
    return [
      {
        id: 'timer-default-1',
        name: 'Pomodoro Focus Timer',
        color: 'indigo',
        isRunning: false,
        startedAt: null,
        duration: 25 * 60 * 1000,
        remainingTime: 25 * 60 * 1000,
        soundAlert: 'chime',
        isCompleted: false,
        createdAt: Date.now(),
      },
    ];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'compact'>('grid');
  const [isMuted, setIsMuted] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<'stopwatch' | 'timer'>('timer');
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  
  // Focus Modal state
  const [focusId, setFocusId] = useState<string | null>(null);

  // Current timestamp tick for smooth UI rendering
  const [now, setNow] = useState(Date.now());

  // Ref to track completed timers so alarms don't double fire
  const firedTimerIds = useRef<Set<string>>(new Set());

  // Unlock web audio on first user click anywhere
  useEffect(() => {
    const handleGlobalClick = () => {
      soundEngine.unlock();
    };
    window.addEventListener('click', handleGlobalClick, { once: true });
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Main high precision ticker tick loop
  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      // Check if any active timers completed
      setTimers((prevTimers) => {
        let hasChanges = false;
        const updated = prevTimers.map((t) => {
          if (t.isRunning && t.startedAt) {
            const elapsed = currentNow - t.startedAt;
            const remaining = t.remainingTime - elapsed;

            if (remaining <= 0) {
              hasChanges = true;
              if (!isMuted && !firedTimerIds.current.has(t.id)) {
                soundEngine.playAlert(t.soundAlert);
                firedTimerIds.current.add(t.id);
              }

              return {
                ...t,
                isRunning: false,
                startedAt: null,
                remainingTime: 0,
                isCompleted: true,
              };
            }
          }
          return t;
        });

        return hasChanges ? updated : prevTimers;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isMuted]);

  // Persist state updates to LocalStorage
  useEffect(() => {
    saveStopwatches(stopwatches);
  }, [stopwatches]);

  useEffect(() => {
    saveTimers(timers);
  }, [timers]);

  // Stopwatch handlers
  const handleStartStopwatch = (id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) =>
        sw.id === id
          ? {
              ...sw,
              isRunning: true,
              startedAt: Date.now(),
            }
          : sw
      )
    );
  };

  const handlePauseStopwatch = (id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.id === id && sw.isRunning && sw.startedAt) {
          const currentElapsed = sw.accumulatedTime + (Date.now() - sw.startedAt);
          return {
            ...sw,
            isRunning: false,
            startedAt: null,
            accumulatedTime: currentElapsed,
          };
        }
        return sw;
      })
    );
  };

  const handleResetStopwatch = (id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) =>
        sw.id === id
          ? {
              ...sw,
              isRunning: false,
              startedAt: null,
              accumulatedTime: 0,
              laps: [],
            }
          : sw
      )
    );
  };

  const handleAddLap = (id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.id === id && sw.isRunning) {
          const currentTotal = getStopwatchElapsed(sw, Date.now());
          const previousLapsTotal = sw.laps.length > 0 ? sw.laps[sw.laps.length - 1].totalTime : 0;
          const lapTime = Math.max(0, currentTotal - previousLapsTotal);

          const newLap = {
            id: `lap-${Date.now()}-${sw.laps.length + 1}`,
            number: sw.laps.length + 1,
            totalTime: currentTotal,
            lapTime: lapTime,
            timestamp: Date.now(),
          };

          return {
            ...sw,
            laps: [...sw.laps, newLap],
          };
        }
        return sw;
      })
    );
  };

  const handleUpdateStopwatchName = (id: string, name: string) => {
    setStopwatches((prev) => prev.map((sw) => (sw.id === id ? { ...sw, name } : sw)));
  };

  const handleUpdateStopwatchColor = (id: string, color: ColorName) => {
    setStopwatches((prev) => prev.map((sw) => (sw.id === id ? { ...sw, color } : sw)));
  };

  const handleDeleteStopwatch = (id: string) => {
    setStopwatches((prev) => prev.filter((sw) => sw.id !== id));
    if (focusId === id) setFocusId(null);
  };

  // Timer handlers
  const handleStartTimer = (id: string) => {
    firedTimerIds.current.delete(id);
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: true,
              startedAt: Date.now(),
              isCompleted: false,
            }
          : t
      )
    );
  };

  const handlePauseTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id && t.isRunning && t.startedAt) {
          const currentRemaining = getTimerRemaining(t, Date.now());
          return {
            ...t,
            isRunning: false,
            startedAt: null,
            remainingTime: currentRemaining,
          };
        }
        return t;
      })
    );
  };

  const handleResetTimer = (id: string) => {
    firedTimerIds.current.delete(id);
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: false,
              startedAt: null,
              remainingTime: t.duration,
              isCompleted: false,
            }
          : t
      )
    );
  };

  const handleAddExtraTime = (id: string, extraMs: number) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const currentRem = getTimerRemaining(t, Date.now());
          const newRem = currentRem + extraMs;
          const newDuration = Math.max(t.duration, newRem);

          return {
            ...t,
            duration: newDuration,
            remainingTime: newRem,
            startedAt: t.isRunning ? Date.now() : null,
            isCompleted: false,
          };
        }
        return t;
      })
    );
  };

  const handleUpdateTimerName = (id: string, name: string) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const handleUpdateTimerColor = (id: string, color: ColorName) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
  };

  const handleUpdateTimerSound = (id: string, soundAlert: SoundPreset) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, soundAlert } : t)));
  };

  const handleDeleteTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
    if (focusId === id) setFocusId(null);
  };

  // Create handlers
  const handleCreateStopwatch = (name: string, color: ColorName) => {
    const newSw: StopwatchItem = {
      id: `sw-${Date.now()}`,
      name,
      color,
      isRunning: false,
      startedAt: null,
      accumulatedTime: 0,
      laps: [],
      createdAt: Date.now(),
    };
    setStopwatches((prev) => [newSw, ...prev]);
  };

  const handleCreateTimer = (name: string, durationMs: number, color: ColorName, soundAlert: SoundPreset) => {
    const newTimer: TimerItem = {
      id: `timer-${Date.now()}`,
      name,
      color,
      isRunning: false,
      startedAt: null,
      duration: durationMs,
      remainingTime: durationMs,
      soundAlert,
      isCompleted: false,
      createdAt: Date.now(),
    };
    setTimers((prev) => [newTimer, ...prev]);
  };

  const handleSelectPreset = (preset: TimerPreset) => {
    handleCreateTimer(preset.title, preset.durationMs, preset.color, 'chime');
  };

  // Batch actions
  const handleStartAll = () => {
    setStopwatches((prev) =>
      prev.map((sw) => (sw.isRunning ? sw : { ...sw, isRunning: true, startedAt: Date.now() }))
    );
    setTimers((prev) =>
      prev.map((t) =>
        t.isRunning || t.isCompleted ? t : { ...t, isRunning: true, startedAt: Date.now() }
      )
    );
  };

  const handlePauseAll = () => {
    const currentNow = Date.now();
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.isRunning && sw.startedAt) {
          return {
            ...sw,
            isRunning: false,
            startedAt: null,
            accumulatedTime: sw.accumulatedTime + (currentNow - sw.startedAt),
          };
        }
        return sw;
      })
    );
    setTimers((prev) =>
      prev.map((t) => {
        if (t.isRunning && t.startedAt) {
          return {
            ...t,
            isRunning: false,
            startedAt: null,
            remainingTime: Math.max(0, t.remainingTime - (currentNow - t.startedAt)),
          };
        }
        return t;
      })
    );
  };

  const handleResetAll = () => {
    setStopwatches((prev) =>
      prev.map((sw) => ({
        ...sw,
        isRunning: false,
        startedAt: null,
        accumulatedTime: 0,
        laps: [],
      }))
    );
    setTimers((prev) =>
      prev.map((t) => ({
        ...t,
        isRunning: false,
        startedAt: null,
        remainingTime: t.duration,
        isCompleted: false,
      }))
    );
  };

  // Filtered lists
  const filteredStopwatches = stopwatches.filter((sw) => {
    const matchesSearch = sw.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor = selectedColorFilter === 'all' || sw.color === selectedColorFilter;
    return matchesSearch && matchesColor;
  });

  const filteredTimers = timers.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor = selectedColorFilter === 'all' || t.color === selectedColorFilter;
    return matchesSearch && matchesColor;
  });

  const runningStopwatchCount = stopwatches.filter((sw) => sw.isRunning).length;
  const runningTimerCount = timers.filter((t) => t.isRunning).length;

  const showStopwatches = activeTab === 'all' || activeTab === 'stopwatches';
  const showTimers = activeTab === 'all' || activeTab === 'timers';

  const isTotalEmpty =
    (showStopwatches ? filteredStopwatches.length : 0) +
      (showTimers ? filteredTimers.length : 0) ===
    0;

  // Selected Focus Item
  const focusedStopwatch = stopwatches.find((sw) => sw.id === focusId);
  const focusedTimer = timers.find((t) => t.id === focusId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stopwatchCount={stopwatches.length}
        runningStopwatchCount={runningStopwatchCount}
        timerCount={timers.length}
        runningTimerCount={runningTimerCount}
        onOpenCreate={(type = 'timer') => {
          setCreateInitialType(type);
          setIsCreateOpen(true);
        }}
        onStartAll={handleStartAll}
        onPauseAll={handlePauseAll}
        onResetAll={handleResetAll}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onOpenPresets={() => setIsPresetsOpen(true)}
      />

      {/* Sub Toolbar: Search, Color Filter & Quick Create Bar */}
      <div className="relative z-30 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full pt-3 sm:pt-6 pb-2">
        <div className="relative z-30 flex flex-col gap-2.5 bg-white/70 dark:bg-slate-900/70 p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm backdrop-blur">
          
          {/* Top Row: Search + Desktop Inline Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Field */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stopwatches & timers..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent"
              />
            </div>

            {/* Desktop Controls (Inline on screens >= 640px) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <ColorFilterDropdown
                selectedColor={selectedColorFilter}
                onSelectColor={setSelectedColorFilter}
                className="w-44"
              />

              {/* Layout Grid / Compact Toggle */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewLayout === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Grid Layout"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout('compact')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewLayout === 'compact'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Compact Layout"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setCreateInitialType('stopwatch');
                  setIsCreateOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>+ Stopwatch</span>
              </button>

              <button
                onClick={() => {
                  setCreateInitialType('timer');
                  setIsCreateOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm whitespace-nowrap"
              >
                <TimerIcon className="w-3.5 h-3.5" />
                <span>+ Timer</span>
              </button>
            </div>
          </div>

          {/* Mobile-Only Controls (< 640px) */}
          <div className="sm:hidden flex flex-col gap-2 pt-1">
            {/* Filter & Layout Switcher Row */}
            <div className="flex items-center justify-between gap-2">
              <ColorFilterDropdown
                selectedColor={selectedColorFilter}
                onSelectColor={setSelectedColorFilter}
                className="flex-1 min-w-0"
              />

              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewLayout === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewLayout('compact')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewLayout === 'compact'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dedicated Second Row for Add Stopwatch & Add Timer (Side-by-Side 50/50) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setCreateInitialType('stopwatch');
                  setIsCreateOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">+ Stopwatch</span>
              </button>

              <button
                onClick={() => {
                  setCreateInitialType('timer');
                  setIsCreateOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-indigo-600/20"
              >
                <TimerIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">+ Timer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Content Area */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 w-full py-4 sm:py-6 flex-1">
        {isTotalEmpty ? (
          <EmptyState
            activeTab={activeTab}
            onOpenCreate={(type = 'timer') => {
              setCreateInitialType(type);
              setIsCreateOpen(true);
            }}
            onOpenPresets={() => setIsPresetsOpen(true)}
          />
        ) : (
          <div className="space-y-6 sm:space-y-10">
            {/* STOPWATCHES SECTION */}
            {showStopwatches && filteredStopwatches.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                      Stopwatches ({filteredStopwatches.length})
                    </h2>
                  </div>
                  {activeTab === 'all' && (
                    <button
                      onClick={() => setActiveTab('stopwatches')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View All Stopwatches →
                    </button>
                  )}
                </div>

                <div
                  className={`grid gap-2.5 sm:gap-4 lg:gap-6 ${
                    viewLayout === 'compact'
                      ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {filteredStopwatches.map((sw) => (
                    <StopwatchCard
                      key={sw.id}
                      stopwatch={sw}
                      elapsedMs={getStopwatchElapsed(sw, now)}
                      onStart={handleStartStopwatch}
                      onPause={handlePauseStopwatch}
                      onReset={handleResetStopwatch}
                      onAddLap={handleAddLap}
                      onUpdateName={handleUpdateStopwatchName}
                      onUpdateColor={handleUpdateStopwatchColor}
                      onDelete={handleDeleteStopwatch}
                      onOpenFocus={setFocusId}
                      isCompact={viewLayout === 'compact'}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* TIMERS SECTION */}
            {showTimers && filteredTimers.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TimerIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                      Timers ({filteredTimers.length})
                    </h2>
                  </div>
                  {activeTab === 'all' && (
                    <button
                      onClick={() => setActiveTab('timers')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View All Timers →
                    </button>
                  )}
                </div>

                <div
                  className={`grid gap-2.5 sm:gap-4 lg:gap-6 ${
                    viewLayout === 'compact'
                      ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {filteredTimers.map((t) => (
                    <TimerCard
                      key={t.id}
                      timer={t}
                      remainingMs={getTimerRemaining(t, now)}
                      onStart={handleStartTimer}
                      onPause={handlePauseTimer}
                      onReset={handleResetTimer}
                      onAddExtraTime={handleAddExtraTime}
                      onUpdateName={handleUpdateTimerName}
                      onUpdateColor={handleUpdateTimerColor}
                      onUpdateSound={handleUpdateTimerSound}
                      onDelete={handleDeleteTimer}
                      onOpenFocus={setFocusId}
                      isCompact={viewLayout === 'compact'}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="font-medium">
          ChronoCraft Multi-Timer & Stopwatch • Modern Native Web Application
        </p>
      </footer>

      {/* Modals */}
      <CreateModal
        key={`${isCreateOpen ? 'open' : 'closed'}-${createInitialType}`}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialType={createInitialType}
        onCreateStopwatch={handleCreateStopwatch}
        onCreateTimer={handleCreateTimer}
      />

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      {focusId && (focusedStopwatch || focusedTimer) && (
        <FocusModal
          isOpen={Boolean(focusId)}
          onClose={() => setFocusId(null)}
          stopwatch={focusedStopwatch}
          timer={focusedTimer}
          elapsedMs={focusedStopwatch ? getStopwatchElapsed(focusedStopwatch, now) : 0}
          remainingMs={focusedTimer ? getTimerRemaining(focusedTimer, now) : 0}
          onStart={(id) => (focusedStopwatch ? handleStartStopwatch(id) : handleStartTimer(id))}
          onPause={(id) => (focusedStopwatch ? handlePauseStopwatch(id) : handlePauseTimer(id))}
          onReset={(id) => (focusedStopwatch ? handleResetStopwatch(id) : handleResetTimer(id))}
          onAddLap={handleAddLap}
          onAddExtraTime={handleAddExtraTime}
        />
      )}
    </div>
  );
}
