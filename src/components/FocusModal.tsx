import React, { useState, useEffect } from 'react';
import { StopwatchItem, TimerItem, IntervalTimerItem } from '../types';
import { getColorTheme } from '../constants/colors';
import { formatTime } from '../utils/timeFormatter';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  Clock, 
  BellRing, 
  Plus, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  Flame,
  Dumbbell,
  SkipForward,
  Target
} from 'lucide-react';

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  stopwatch?: StopwatchItem;
  timer?: TimerItem;
  interval?: IntervalTimerItem;
  elapsedMs?: number;
  remainingMs?: number;
  remainingPhaseMs?: number;
  now?: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onSkipPhase?: (id: string) => void;
  onAddLap?: (id: string) => void;
  onAddExtraTime?: (id: string, ms: number) => void;
}

export const FocusModal: React.FC<FocusModalProps> = ({
  isOpen,
  onClose,
  stopwatch,
  timer,
  interval,
  elapsedMs = 0,
  remainingMs = 0,
  remainingPhaseMs = 0,
  now,
  onStart,
  onPause,
  onReset,
  onSkipPhase,
  onAddLap,
  onAddExtraTime,
}) => {
  const item = stopwatch || timer || interval;
  const isStopwatch = Boolean(stopwatch);
  const isTimer = Boolean(timer);
  const isInterval = Boolean(interval);

  const [showLapsSheet, setShowLapsSheet] = useState(false);
  const [copiedLaps, setCopiedLaps] = useState(false);

  // Interval state calculations
  const currentPhase = interval && interval.phases && interval.phases.length > 0
    ? (interval.phases[interval.currentPhaseIndex] || interval.phases[0])
    : null;

  const currentRound = interval ? (interval.currentRound || 1) : 1;
  const totalRounds = interval ? (interval.totalRounds || 8) : 8;

  const currentPhaseDuration = currentPhase && typeof currentPhase.durationMs === 'number' && !isNaN(currentPhase.durationMs)
    ? currentPhase.durationMs
    : 30000;

  const safeIntervalRemaining = typeof remainingPhaseMs === 'number' && !isNaN(remainingPhaseMs)
    ? remainingPhaseMs
    : interval?.isRunning && interval.startedAt
      ? Math.max(0, (typeof interval.phaseRemainingMs === 'number' && !isNaN(interval.phaseRemainingMs) ? interval.phaseRemainingMs : currentPhaseDuration) - ((now || Date.now()) - interval.startedAt))
      : (interval && typeof interval.phaseRemainingMs === 'number' && !isNaN(interval.phaseRemainingMs) ? interval.phaseRemainingMs : currentPhaseDuration);

  // Fastest & slowest lap calculation for stopwatch
  let fastestLapId: string | null = null;
  let slowestLapId: string | null = null;
  if (stopwatch?.laps && stopwatch.laps.length > 1) {
    let min = Infinity;
    let max = -Infinity;
    stopwatch.laps.forEach((lap) => {
      if (lap.lapTime < min) {
        min = lap.lapTime;
        fastestLapId = lap.id;
      }
      if (lap.lapTime > max) {
        max = lap.lapTime;
        slowestLapId = lap.id;
      }
    });
  }

  const copyLapsToClipboard = () => {
    if (!stopwatch?.laps.length) return;
    const text = stopwatch.laps
      .map((l) => {
        const lt = formatTime(l.lapTime);
        const tt = formatTime(l.totalTime);
        return `Lap ${l.number}: ${lt.minutes}:${lt.seconds}.${lt.centiseconds} (Split: ${tt.minutes}:${tt.seconds}.${tt.centiseconds})`;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLaps(true);
    setTimeout(() => setCopiedLaps(false), 2000);
  };

  // Keyboard shortcut handler
  useEffect(() => {
    if (!isOpen || !item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (item.isRunning) {
          onPause(item.id);
        } else {
          onStart(item.id);
        }
      } else if (e.code === 'KeyR') {
        onReset(item.id);
      } else if (e.code === 'KeyS' && isInterval && onSkipPhase) {
        onSkipPhase(item.id);
      } else if (e.code === 'KeyL' && isStopwatch && onAddLap) {
        if (stopwatch?.isRunning) {
          onAddLap(stopwatch.id);
        }
      } else if (e.code === 'KeyV' && isStopwatch && (stopwatch?.laps?.length || 0) > 0) {
        setShowLapsSheet((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (showLapsSheet) {
          setShowLapsSheet(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, item, isStopwatch, isInterval, stopwatch, showLapsSheet, onStart, onPause, onReset, onSkipPhase, onAddLap, onClose]);

  if (!isOpen || !item) return null;

  // Active theme calculation
  const phaseColor = isInterval ? (currentPhase?.color || interval?.color || 'rose') : item.color;
  const theme = getColorTheme(phaseColor);

  let displayMs = 0;
  if (isStopwatch) {
    displayMs = elapsedMs;
  } else if (isTimer) {
    displayMs = remainingMs;
  } else if (isInterval) {
    displayMs = safeIntervalRemaining;
  }

  const time = formatTime(displayMs);
  const timerDurationFormatted = isTimer && timer ? formatTime(timer.duration) : null;

  // Compute live current lap time for stopwatch in Focus Mode
  const previousLapsTotalMs = stopwatch?.laps?.reduce((acc, lap) => acc + lap.lapTime, 0) || 0;
  const currentLapMs = isStopwatch ? Math.max(0, elapsedMs - previousLapsTotalMs) : 0;
  const currentLapTime = formatTime(currentLapMs);

  // Stopwatch Target Goal state
  const stopwatchTargetMs = stopwatch?.targetGoalMs || 0;
  const hasStopwatchTarget = isStopwatch && stopwatchTargetMs > 0;
  const isStopwatchTargetReached = hasStopwatchTarget && elapsedMs >= stopwatchTargetMs;
  const targetFormatted = hasStopwatchTarget ? formatTime(stopwatchTargetMs) : null;
  const targetPercent = hasStopwatchTarget
    ? Math.min(100, Math.round((elapsedMs / stopwatchTargetMs) * 100))
    : 0;

  // Progress ratio calculation
  let progressRatio = 0;
  if (isTimer && timer && timer.duration > 0) {
    progressRatio = Math.max(0, Math.min(1, remainingMs / timer.duration));
  } else if (isInterval && currentPhaseDuration > 0) {
    progressRatio = Math.max(0, Math.min(1, safeIntervalRemaining / currentPhaseDuration));
  } else if (hasStopwatchTarget) {
    progressRatio = Math.min(1, elapsedMs / stopwatchTargetMs);
  }
  const strokeDashoffset = 283 * (1 - progressRatio);

  const nextPhaseIndex = interval?.phases && interval.phases.length > 0
    ? (interval.currentPhaseIndex + 1) % interval.phases.length
    : 0;
  const nextPhase = interval?.phases && interval.phases.length > 1 ? interval.phases[nextPhaseIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-8 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fade-in text-slate-900 dark:text-white select-none transition-colors">
      <div className="relative w-full max-w-4xl h-full max-h-[92vh] flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 overflow-hidden bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-colors">
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 sm:pb-6">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: theme.accentHex }} />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">{item.name}</h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize block">
                {isStopwatch ? 'Stopwatch Focus Mode' : isInterval ? 'HIIT Interval Focus Mode' : 'Timer Focus Mode'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStopwatch && stopwatch && stopwatch.laps.length > 0 && (
              <button
                onClick={() => setShowLapsSheet(!showLapsSheet)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showLapsSheet 
                    ? 'bg-indigo-600 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                    : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-slate-300 dark:border-white/15'
                }`}
                title="Toggle Laps (V)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{stopwatch.laps.length} Laps</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
              title="Exit Focus Mode (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Big Giant Display Center */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-2">
          {isTimer && timer?.isCompleted ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xl animate-bounce">
                <BellRing className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h2 className="text-3xl sm:text-6xl font-black text-rose-500 dark:text-rose-400">Time's Up!</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">Timer "{timer.name}" has finished.</p>
              <div className="pt-2">
                <button
                  onClick={() => onReset(timer.id)}
                  className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-base shadow-xl flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Dismiss Alarm</span>
                </button>
              </div>
            </div>
          ) : isInterval && interval?.isCompleted ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl animate-bounce">
                <Flame className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h2 className="text-3xl sm:text-6xl font-black text-emerald-600 dark:text-emerald-400">Workout Complete!</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">Great job! All {interval.totalRounds} rounds completed.</p>
              <div className="pt-2">
                <button
                  onClick={() => onReset(interval.id)}
                  className="py-3 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-base shadow-xl flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Restart Workout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {/* Phase Name & Round Counter Placed OUTSIDE Above the Time Ring */}
              {isInterval && currentPhase && (
                <div className="mb-3 sm:mb-5 flex items-center gap-2">
                  <span 
                    className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md text-white"
                    style={{ backgroundColor: theme.accentHex }}
                  >
                    {currentPhase.type === 'work' ? (
                      <Flame className="w-4 h-4" />
                    ) : (
                      <Dumbbell className="w-4 h-4" />
                    )}
                    <span>{currentPhase.name}</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-white/10 px-3 py-1 rounded-full border border-slate-300/50 dark:border-white/10">
                    Round {currentRound} of {totalRounds}
                  </span>
                </div>
              )}

              {/* Time Ring & Clock Digits Container */}
              <div className="relative flex flex-col items-center justify-center">
                {(isTimer || isInterval || hasStopwatchTarget) && (
                  <svg className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 -rotate-90 mb-2" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" className="stroke-slate-200 dark:stroke-white/10 fill-none" strokeWidth="4" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      className="fill-none transition-all duration-300 ease-linear"
                      strokeWidth="4"
                      strokeDasharray="283"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke={isStopwatchTargetReached ? '#10B981' : theme.accentHex}
                    />
                  </svg>
                )}

                <div className={`${isTimer || isInterval || hasStopwatchTarget ? 'absolute inset-0 flex flex-col items-center justify-center' : ''}`}>
                  {/* Timer Duration Badge */}
                  {isTimer && timerDurationFormatted && (
                    <div className="mb-2 sm:mb-4 flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-sm text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-white/10 border border-slate-300/60 dark:border-white/15">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>Set for {parseInt(timerDurationFormatted.hours, 10) > 0 && `${timerDurationFormatted.hours}:`}{timerDurationFormatted.minutes}:{timerDurationFormatted.seconds}</span>
                    </div>
                  )}

                  {/* Stopwatch Target Goal Badge */}
                  {hasStopwatchTarget && targetFormatted && (
                    <div className={`mb-2 sm:mb-4 flex items-center justify-center gap-2 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold tracking-wide shadow-sm border ${
                      isStopwatchTargetReached
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700'
                        : 'text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-white/10 border-slate-300/60 dark:border-white/15'
                    }`}>
                      <Target className={`w-3.5 h-3.5 ${isStopwatchTargetReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-500 dark:text-indigo-400'}`} />
                      <span>
                        Target: {parseInt(targetFormatted.hours, 10) > 0 && `${targetFormatted.hours}:`}{targetFormatted.minutes}:{targetFormatted.seconds}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        isStopwatchTargetReached
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                          : 'bg-slate-300 dark:bg-white/15 text-slate-800 dark:text-slate-200'
                      }`}>
                        {isStopwatchTargetReached ? 'Goal Reached! 🎉' : `${targetPercent}%`}
                      </span>
                    </div>
                  )}

                                    {/* Big Digits */}
                  <div className="inline-flex items-baseline font-mono tracking-tighter font-extrabold text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-slate-900 dark:text-white">
                    {parseInt(time.hours, 10) > 0 && (
                      <>
                        <span>{time.hours}</span>
                        <span className="text-slate-400 dark:text-slate-500 mx-1">:</span>
                      </>
                    )}
                    <span>{time.minutes}</span>
                    <span className="text-slate-400 dark:text-slate-500 mx-0.5 sm:mx-1">:</span>
                    <span>{time.seconds}</span>
                    {isStopwatch && (
                      <span className="text-2xl sm:text-4xl md:text-5xl text-slate-500 dark:text-slate-400 font-bold ml-1.5 sm:ml-2">
                        .{time.centiseconds}
                      </span>
                    )}
                  </div>

                  {/* Live Current Lap Time Display in Focus Mode */}
                  {isStopwatch && stopwatch && stopwatch.laps.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs sm:text-sm font-mono font-bold text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-white/10">
                      <span className="text-[10px] sm:text-xs font-sans font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                        Current Lap #{stopwatch.laps.length + 1}:
                      </span>
                      <span>
                        {parseInt(currentLapTime.hours, 10) > 0 && `${currentLapTime.hours}:`}
                        {currentLapTime.minutes}:{currentLapTime.seconds}.{currentLapTime.centiseconds}
                      </span>
                    </div>
                  )}

                  {/* Status or Next Phase info */}
                  <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 sm:mt-4 tracking-widest uppercase flex items-center justify-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
                    <span>{item.isRunning ? 'Active' : 'Paused'}</span>
                    {isInterval && nextPhase && (
                      <span className="normal-case text-slate-500 dark:text-slate-400 font-sans ml-2">
                        (Next: {nextPhase.name})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stopwatch Lap Counter Button in Focus Mode */}
          {isStopwatch && stopwatch && stopwatch.laps.length > 0 && (
            <button
              onClick={() => setShowLapsSheet(!showLapsSheet)}
              className="mt-4 sm:mt-6 flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/15 px-3.5 sm:px-4 py-1.5 rounded-full cursor-pointer transition-all active:scale-95 shadow-sm"
              title="Click to view full lap breakdown"
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{stopwatch.laps.length} Laps Recorded</span>
              <span className="text-[11px] bg-slate-300 dark:bg-white/15 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full font-medium ml-1">
                {showLapsSheet ? 'Hide History' : 'View History'}
              </span>
              {showLapsSheet ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Quick Add time for Timer */}
        {isTimer && timer && !timer.isCompleted && onAddExtraTime && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quick Add:</span>
            <button
              onClick={() => onAddExtraTime(timer.id, 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-xs text-slate-800 dark:text-white font-medium transition-colors flex items-center gap-1 cursor-pointer border border-slate-300/60 dark:border-transparent"
            >
              <Plus className="w-3 h-3" /> +1m
            </button>
            <button
              onClick={() => onAddExtraTime(timer.id, 5 * 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-xs text-slate-800 dark:text-white font-medium transition-colors flex items-center gap-1 cursor-pointer border border-slate-300/60 dark:border-transparent"
            >
              <Plus className="w-3 h-3" /> +5m
            </button>
            <button
              onClick={() => onAddExtraTime(timer.id, 10 * 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-xs text-slate-800 dark:text-white font-medium transition-colors flex items-center gap-1 cursor-pointer border border-slate-300/60 dark:border-transparent"
            >
              <Plus className="w-3 h-3" /> +10m
            </button>
          </div>
        )}

        {/* Bottom Control Dock */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-slate-200 dark:border-white/10 pt-4 sm:pt-6">
          {/* Keyboard Hints */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>[Space] Start/Pause</span>
            <span>•</span>
            <span>[R] Reset</span>
            {isStopwatch && (
              <>
                <span>•</span>
                <span>[L] Lap</span>
                <span>•</span>
                <span>[V] View Laps</span>
              </>
            )}
            {isInterval && (
              <>
                <span>•</span>
                <span>[S] Skip Phase</span>
              </>
            )}
            <span>•</span>
            <span>[Esc] Exit</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center">
            {isStopwatch && onAddLap && (
              <button
                onClick={() => onAddLap(item.id)}
                disabled={!item.isRunning}
                className="flex-1 sm:flex-none py-3 px-5 sm:px-6 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Lap</span>
              </button>
            )}

            {isInterval && onSkipPhase && (
              <button
                onClick={() => onSkipPhase(item.id)}
                className="flex-1 sm:flex-none py-3 px-4 sm:px-5 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Skip Current Phase"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Skip</span>
              </button>
            )}

            <button
              onClick={() => (item.isRunning ? onPause(item.id) : onStart(item.id))}
              className="flex-1 sm:flex-none py-3 sm:py-3.5 px-6 sm:px-8 rounded-2xl text-white font-bold text-base sm:text-lg shadow-xl flex items-center justify-center gap-2.5 sm:gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ backgroundColor: theme.accentHex }}
            >
              {item.isRunning ? (
                <>
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              onClick={() => onReset(item.id)}
              className="flex-1 sm:flex-none py-3 px-5 sm:px-6 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Full Laps Drawer / Modal in Focus Mode */}
        {isStopwatch && stopwatch && showLapsSheet && (
          <div className="absolute inset-x-3 sm:inset-x-12 bottom-20 top-20 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-300 dark:border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Laps History ({stopwatch.laps.length})</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyLapsToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer border border-slate-200 dark:border-transparent"
                  title="Copy all laps to clipboard"
                >
                  {copiedLaps ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Laps</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowLapsSheet(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  title="Close Laps Sheet (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Laps Table Header */}
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-sans text-xs font-semibold pt-3 pb-2 px-3 border-b border-slate-100 dark:border-white/5">
              <span className="w-20 shrink-0 text-left">Lap</span>
              <span className="flex-1 text-center">Lap Split Time</span>
              <span className="w-24 shrink-0 text-right">Total Split Time</span>
            </div>

            {/* Scrollable Lap Rows */}
            <div className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1">
              {[...stopwatch.laps].reverse().map((lap) => {
                const isFastest = lap.id === fastestLapId;
                const isSlowest = lap.id === slowestLapId;
                const lTime = formatTime(lap.lapTime);
                const tTime = formatTime(lap.totalTime);

                return (
                  <div
                    key={lap.id}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                      isFastest
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-500/40 shadow-xs'
                        : isSlowest
                        ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-500/40 shadow-xs'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5'
                    }`}
                  >
                    <div className="w-20 shrink-0 flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">Lap {lap.number}</span>
                      {isFastest && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                          Fast
                        </span>
                      )}
                      {isSlowest && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-500/30 text-rose-700 dark:text-rose-200 px-1.5 py-0.5 rounded shrink-0">
                          Slow
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-center font-mono tabular-nums font-bold text-xs sm:text-sm text-slate-900 dark:text-white px-2">
                      {lTime.minutes}:{lTime.seconds}.{lTime.centiseconds}
                    </span>
                    <span className="w-24 shrink-0 text-right font-mono tabular-nums text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {tTime.minutes}:{tTime.seconds}.{tTime.centiseconds}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick summary stats in footer */}
            {stopwatch.laps.length > 1 && (
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">Total: {stopwatch.laps.length} recorded</span>
                <button
                  onClick={() => setShowLapsSheet(false)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-white bg-indigo-50 hover:bg-indigo-100 dark:bg-white/15 dark:hover:bg-white/25 px-3 py-1 rounded-lg transition-colors cursor-pointer border border-indigo-100 dark:border-transparent"
                >
                  Return to Timer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
