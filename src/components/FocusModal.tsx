import React, { useState, useEffect } from 'react';
import { StopwatchItem, TimerItem } from '../types';
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
  Layers
} from 'lucide-react';

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  stopwatch?: StopwatchItem;
  timer?: TimerItem;
  elapsedMs?: number;
  remainingMs?: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onAddLap?: (id: string) => void;
  onAddExtraTime?: (id: string, ms: number) => void;
}

export const FocusModal: React.FC<FocusModalProps> = ({
  isOpen,
  onClose,
  stopwatch,
  timer,
  elapsedMs = 0,
  remainingMs = 0,
  onStart,
  onPause,
  onReset,
  onAddLap,
  onAddExtraTime,
}) => {
  const item = stopwatch || timer;
  const isStopwatch = Boolean(stopwatch);
  const [showLapsSheet, setShowLapsSheet] = useState(false);
  const [copiedLaps, setCopiedLaps] = useState(false);

  // Fastest & slowest lap calculation
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
  }, [isOpen, item, isStopwatch, stopwatch, showLapsSheet, onStart, onPause, onReset, onAddLap, onClose]);

  if (!isOpen || !item) return null;

  const theme = getColorTheme(item.color);
  const displayMs = isStopwatch ? elapsedMs : remainingMs;
  const time = formatTime(displayMs);

  const progressRatio = timer && timer.duration > 0 ? Math.max(0, Math.min(1, remainingMs / timer.duration)) : 0;
  const strokeDashoffset = 283 * (1 - progressRatio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-8 bg-slate-950/95 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="relative w-full max-w-4xl h-full max-h-[92vh] flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 overflow-hidden">
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-4 sm:pb-6">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: theme.accentHex }} />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate max-w-[200px] sm:max-w-md">{item.name}</h1>
              <span className="text-xs text-slate-400 font-medium capitalize block">
                {isStopwatch ? 'Stopwatch Focus Mode' : 'Timer Focus Mode'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStopwatch && stopwatch && stopwatch.laps.length > 0 && (
              <button
                onClick={() => setShowLapsSheet(!showLapsSheet)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showLapsSheet 
                    ? 'bg-white text-slate-900 shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
                title="Toggle Laps (V)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{stopwatch.laps.length} Laps</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Exit Focus Mode (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Big Giant Display Center */}
        <div className="my-auto flex flex-col items-center justify-center w-full py-2">
          {!isStopwatch && timer?.isCompleted ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xl animate-bounce">
                <BellRing className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h2 className="text-3xl sm:text-6xl font-black text-rose-400">Time's Up!</h2>
              <p className="text-base sm:text-lg text-slate-300">Timer "{timer.name}" has finished.</p>
              <div className="pt-2">
                <button
                  onClick={() => onReset(timer.id)}
                  className="py-3 px-8 rounded-2xl bg-white text-slate-900 font-bold text-base shadow-xl flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Dismiss Alarm</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center">
              {!isStopwatch && (
                <svg className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 -rotate-90 mb-2" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="stroke-white/10 fill-none" strokeWidth="4" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="fill-none transition-all duration-300 ease-linear"
                    strokeWidth="4"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke={theme.accentHex}
                  />
                </svg>
              )}

              <div className={`${!isStopwatch ? 'absolute inset-0 flex flex-col items-center justify-center' : ''}`}>
                <div className="inline-flex items-baseline font-mono tracking-tighter font-extrabold text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white">
                  {parseInt(time.hours, 10) > 0 && (
                    <>
                      <span>{time.hours}</span>
                      <span className="text-slate-500 mx-1">:</span>
                    </>
                  )}
                  <span>{time.minutes}</span>
                  <span className="text-slate-500 mx-0.5 sm:mx-1">:</span>
                  <span>{time.seconds}</span>
                  {isStopwatch && (
                    <span className="text-2xl sm:text-4xl md:text-5xl text-slate-400 font-bold ml-1.5 sm:ml-2">
                      .{time.centiseconds}
                    </span>
                  )}
                </div>

                <div className="text-xs sm:text-sm font-medium text-slate-400 mt-2 sm:mt-4 tracking-widest uppercase flex items-center justify-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span>{item.isRunning ? 'Active' : 'Paused'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stopwatch Lap Counter Button in Focus Mode */}
          {isStopwatch && stopwatch && stopwatch.laps.length > 0 && (
            <button
              onClick={() => setShowLapsSheet(!showLapsSheet)}
              className="mt-4 sm:mt-6 flex items-center gap-2 text-xs sm:text-sm text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 sm:px-4 py-1.5 rounded-full cursor-pointer transition-all active:scale-95 shadow-sm"
              title="Click to view full lap breakdown"
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="font-semibold">{stopwatch.laps.length} Laps Recorded</span>
              <span className="text-[11px] bg-white/15 text-slate-200 px-2 py-0.5 rounded-full font-medium ml-1">
                {showLapsSheet ? 'Hide History' : 'View History'}
              </span>
              {showLapsSheet ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Quick Add time for Timer */}
        {!isStopwatch && timer && !timer.isCompleted && onAddExtraTime && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-400">Quick Add:</span>
            <button
              onClick={() => onAddExtraTime(timer.id, 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> +1m
            </button>
            <button
              onClick={() => onAddExtraTime(timer.id, 5 * 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> +5m
            </button>
            <button
              onClick={() => onAddExtraTime(timer.id, 10 * 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> +10m
            </button>
          </div>
        )}

        {/* Bottom Control Dock */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-white/10 pt-4 sm:pt-6">
          {/* Keyboard Hints */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono">
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
            <span>•</span>
            <span>[Esc] Exit</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center">
            {isStopwatch && onAddLap && (
              <button
                onClick={() => onAddLap(item.id)}
                disabled={!item.isRunning}
                className="flex-1 sm:flex-none py-3 px-5 sm:px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Lap</span>
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
              className="flex-1 sm:flex-none py-3 px-5 sm:px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Full Laps Drawer / Modal in Focus Mode */}
        {isStopwatch && stopwatch && showLapsSheet && (
          <div className="absolute inset-x-3 sm:inset-x-12 bottom-20 top-20 z-20 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold text-white">Laps History ({stopwatch.laps.length})</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyLapsToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                  title="Copy all laps to clipboard"
                >
                  {copiedLaps ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
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
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Laps Sheet (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Laps Table Header */}
            <div className="flex items-center justify-between text-slate-400 font-sans text-xs font-semibold pt-3 pb-2 px-3 border-b border-white/5">
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
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-xs'
                        : isSlowest
                        ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40 shadow-xs'
                        : 'text-slate-200 hover:bg-white/5 border border-white/5'
                    }`}
                  >
                    <div className="w-20 shrink-0 flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">Lap {lap.number}</span>
                      {isFastest && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                          Fast
                        </span>
                      )}
                      {isSlowest && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded shrink-0">
                          Slow
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-center font-mono tabular-nums font-bold text-xs sm:text-sm text-white px-2">
                      {lTime.minutes}:{lTime.seconds}.{lTime.centiseconds}
                    </span>
                    <span className="w-24 shrink-0 text-right font-mono tabular-nums text-xs sm:text-sm text-slate-400">
                      {tTime.minutes}:{tTime.seconds}.{tTime.centiseconds}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick summary stats in footer */}
            {stopwatch.laps.length > 1 && (
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">Total: {stopwatch.laps.length} recorded</span>
                <button
                  onClick={() => setShowLapsSheet(false)}
                  className="text-xs font-semibold text-white bg-white/15 hover:bg-white/25 px-3 py-1 rounded-lg transition-colors cursor-pointer"
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

