import React, { useState, useEffect } from 'react';
import { ColorName, SoundPreset, TimerPreset } from '../types';
import { COLOR_KEYS, COLOR_THEMES } from '../constants/colors';
import { TIMER_PRESETS } from '../constants/presets';
import { ColorPicker } from './ColorPicker';
import { soundEngine } from '../utils/audio';
import { 
  X, 
  Clock, 
  Timer as TimerIcon, 
  Sparkles, 
  Volume2, 
  Play, 
  Plus, 
  Check 
} from 'lucide-react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'stopwatch' | 'timer';
  onCreateStopwatch: (name: string, color: ColorName) => void;
  onCreateTimer: (name: string, durationMs: number, color: ColorName, sound: SoundPreset) => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  initialType = 'timer',
  onCreateStopwatch,
  onCreateTimer,
}) => {
  const [type, setType] = useState<'stopwatch' | 'timer'>(initialType);
  const [name, setName] = useState('');
  const [color, setColor] = useState<ColorName>('blue');
  const [sound, setSound] = useState<SoundPreset>('chime');

  // Custom duration state for Timer
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  // Sync state whenever the modal opens or initialType changes
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setName('');
      setColor('blue');
      setSound('chime');
      setHours(0);
      setMinutes(5);
      setSeconds(0);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: TimerPreset) => {
    const totalMs = preset.durationMs;
    const h = Math.floor(totalMs / (1000 * 60 * 60));
    const m = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((totalMs % (1000 * 60)) / 1000);

    setName(preset.title);
    setColor(preset.color);
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'stopwatch') {
      const finalName = name.trim() || 'Stopwatch';
      onCreateStopwatch(finalName, color);
    } else {
      const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
      if (durationMs <= 0) {
        alert('Please enter a duration greater than 0 seconds.');
        return;
      }
      const finalName = name.trim() || `${minutes}m Timer`;
      onCreateTimer(finalName, durationMs, color, sound);
    }
    onClose();
    // Reset defaults
    setName('');
    setHours(0);
    setMinutes(5);
    setSeconds(0);
  };

  const handleTestSound = () => {
    soundEngine.playAlert(sound);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create New</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Type Toggle Segment */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('timer');
                if (!name || name === 'Stopwatch') setName('Timer');
              }}
              className={`py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                type === 'timer'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TimerIcon className="w-4 h-4" />
              <span>Timer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('stopwatch');
                if (!name || name === 'Timer') setName('Stopwatch');
              }}
              className={`py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                type === 'stopwatch'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Stopwatch</span>
            </button>
          </div>

          {/* Presets Bar for Timer */}
          {type === 'timer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIMER_PRESETS.map((preset) => {
                  const theme = COLOR_THEMES[preset.color];
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition-all hover:scale-102 flex flex-col justify-between ${
                        name === preset.title
                          ? `${theme.badge} ring-2 ring-offset-1 ring-indigo-500`
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{preset.title}</span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        {preset.durationMs >= 60000 ? `${Math.floor(preset.durationMs / 60000)}m` : `${preset.durationMs / 1000}s`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Title / Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'timer' ? 'e.g. Focus Sprint, Boiling Eggs, Workout Rest' : 'e.g. Lap Split Test, Project Time'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
          </div>

          {/* Custom Duration Pickers (for Timer) */}
          {type === 'timer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Duration (Hours : Minutes : Seconds)
              </label>
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                {/* Hours */}
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Hours</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-2 text-center text-xl font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                {/* Minutes */}
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full py-2 text-center text-xl font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                {/* Seconds */}
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Seconds</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full py-2 text-center text-xl font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Color Tag Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Color Theme Badge
            </label>
            <ColorPicker selectedColor={color} onChange={setColor} />
          </div>

          {/* Sound Preset (for Timer) */}
          {type === 'timer' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  Alert Sound
                </label>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" /> Preview Sound
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['chime', 'digital', 'bell', 'marimba', 'gentle'] as SoundPreset[]).map((snd) => (
                  <button
                    key={snd}
                    type="button"
                    onClick={() => {
                      setSound(snd);
                      soundEngine.playAlert(snd);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize flex items-center justify-between transition-all ${
                      sound === snd
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{snd}</span>
                    {sound === snd && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create {type === 'stopwatch' ? 'Stopwatch' : 'Timer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
