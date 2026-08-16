import React, { useEffect } from 'react';
import { StopwatchItem, TimerItem } from '../types';
import { COLOR_THEMES } from '../constants/colors';
import { formatTime } from '../utils/timeFormatter';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  Clock, 
  BellRing, 
  Plus 
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
      } else if (e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, item, isStopwatch, stopwatch, onStart, onPause, onReset, onAddLap, onClose]);

  if (!isOpen || !item) return null;

  const theme = COLOR_THEMES[item.color] || COLOR_THEMES.blue;
  const displayMs = isStopwatch ? elapsedMs : remainingMs;
  const time = formatTime(displayMs);

  const progressRatio = timer && timer.duration > 0 ? Math.max(0, Math.min(1, remainingMs / timer.duration)) : 0;
  const strokeDashoffset = 283 * (1 - progressRatio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="relative w-full max-w-4xl h-full max-h-[85vh] flex flex-col items-center justify-between p-6 sm:p-12">
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.accentHex }} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{item.name}</h1>
              <span className="text-xs text-slate-400 font-medium capitalize">
                {isStopwatch ? 'Stopwatch Focus Mode' : 'Timer Focus Mode'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Exit Focus Mode (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Big Giant Display Center */}
        <div className="my-auto flex flex-col items-center justify-center w-full">
          {!isStopwatch && timer?.isCompleted ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-24 h-24 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xl animate-bounce">
                <BellRing className="w-12 h-12" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-rose-400">Time's Up!</h2>
              <p className="text-lg text-slate-300">Timer "{timer.name}" has finished.</p>
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
                <svg className="w-72 h-72 sm:w-96 sm:h-96 -rotate-90 mb-4" viewBox="0 0 100 100">
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
                <div className="inline-flex items-baseline font-mono tracking-tighter font-extrabold text-6xl sm:text-8xl md:text-9xl text-white">
                  {parseInt(time.hours, 10) > 0 && (
                    <>
                      <span>{time.hours}</span>
                      <span className="text-slate-500 mx-1">:</span>
                    </>
                  )}
                  <span>{time.minutes}</span>
                  <span className="text-slate-500 mx-1">:</span>
                  <span>{time.seconds}</span>
                  {isStopwatch && (
                    <span className="text-3xl sm:text-5xl text-slate-400 font-bold ml-2">
                      .{time.centiseconds}
                    </span>
                  )}
                </div>

                <div className="text-sm font-medium text-slate-400 mt-4 tracking-widest uppercase flex items-center justify-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span>{item.isRunning ? 'Active' : 'Paused'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stopwatch Lap Counter if active */}
          {isStopwatch && stopwatch && stopwatch.laps.length > 0 && (
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-300 bg-white/10 px-4 py-1.5 rounded-full">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{stopwatch.laps.length} Laps Recorded</span>
            </div>
          )}
        </div>

        {/* Quick Add time for Timer */}
        {!isStopwatch && timer && !timer.isCompleted && onAddExtraTime && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-400">Quick Add:</span>
            <button
              onClick={() => onAddExtraTime(timer.id, 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> +1m
            </button>
            <button
              onClick={() => onAddExtraTime(timer.id, 5 * 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> +5m
            </button>
            <button
              onClick={() => onAddExtraTime(timer.id, 10 * 60 * 1000)}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> +10m
            </button>
          </div>
        )}

        {/* Bottom Control Dock */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
          {/* Keyboard Hints */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>[Space] Start/Pause</span>
            <span>•</span>
            <span>[R] Reset</span>
            {isStopwatch && (
              <>
                <span>•</span>
                <span>[L] Lap</span>
              </>
            )}
            <span>•</span>
            <span>[Esc] Exit</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            {isStopwatch && onAddLap && (
              <button
                onClick={() => onAddLap(item.id)}
                disabled={!item.isRunning}
                className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flag className="w-5 h-5" />
                <span>Lap</span>
              </button>
            )}

            <button
              onClick={() => (item.isRunning ? onPause(item.id) : onStart(item.id))}
              className="py-3.5 px-8 rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: theme.accentHex }}
            >
              {item.isRunning ? (
                <>
                  <Pause className="w-6 h-6 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              onClick={() => onReset(item.id)}
              className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
