import React, { useState, useEffect } from 'react';
import { ColorName, SoundPreset, TimerPreset, IntervalPhase } from '../types';
import { COLOR_KEYS, COLOR_THEMES, getColorTheme } from '../constants/colors';
import { TIMER_PRESETS } from '../constants/presets';
import { ColorPicker } from './ColorPicker';
import { soundEngine } from '../utils/audio';
import { capitalizeWords } from '../utils/textFormatters';
import { 
  X, 
  Clock, 
  Timer as TimerIcon, 
  Sparkles, 
  Volume2, 
  Play, 
  Plus, 
  Check, 
  Target, 
  Flame, 
  Dumbbell, 
  Activity,
  Layers
} from 'lucide-react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'stopwatch' | 'timer' | 'interval';
  onCreateStopwatch: (name: string, color: ColorName, targetGoalMs?: number) => void;
  onCreateTimer: (
    name: string, 
    durationMs: number, 
    color: ColorName, 
    sound: SoundPreset, 
    soundRepeat?: number, 
    overtimeEnabled?: boolean,
    voiceEnabled?: boolean
  ) => void;
  onCreateInterval: (
    name: string,
    color: ColorName,
    rounds: number,
    phases: IntervalPhase[],
    sound: SoundPreset,
    voiceEnabled?: boolean
  ) => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  initialType = 'timer',
  onCreateStopwatch,
  onCreateTimer,
  onCreateInterval,
}) => {
  const [type, setType] = useState<'stopwatch' | 'timer' | 'interval'>(initialType);
  const [name, setName] = useState('');
  const [color, setColor] = useState<ColorName>('indigo');
  const [sound, setSound] = useState<SoundPreset>('chime');
  const [soundRepeat, setSoundRepeat] = useState<number>(3);
  const [overtimeEnabled, setOvertimeEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Custom duration state for Timer
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  // Target Goal for Stopwatch
  const [enableTargetGoal, setEnableTargetGoal] = useState(false);
  const [targetHours, setTargetHours] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(5);
  const [targetSeconds, setTargetSeconds] = useState(0);

  // Interval / HIIT settings
  const [intervalRounds, setIntervalRounds] = useState(8);
  const [workSeconds, setWorkSeconds] = useState(20);
  const [restSeconds, setRestSeconds] = useState(10);
  const [prepareSeconds, setPrepareSeconds] = useState(5);

  // Sync state whenever the modal opens or initialType changes
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setName('');
      setColor(initialType === 'interval' ? 'rose' : 'indigo');
      setSound('chime');
      setSoundRepeat(3);
      setOvertimeEnabled(true);
      setVoiceEnabled(true);
      setHours(0);
      setMinutes(5);
      setSeconds(0);
      setEnableTargetGoal(false);
      setTargetHours(0);
      setTargetMinutes(5);
      setTargetSeconds(0);
      setIntervalRounds(8);
      setWorkSeconds(20);
      setRestSeconds(10);
      setPrepareSeconds(5);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: TimerPreset) => {
    if (preset.intervalConfig) {
      setType('interval');
      setName(capitalizeWords(preset.title));
      setColor(preset.color);
      setIntervalRounds(preset.intervalConfig.rounds || 8);
      const work = preset.intervalConfig.phases.find((p) => p.type === 'work');
      const rest = preset.intervalConfig.phases.find((p) => p.type === 'rest');
      if (work) setWorkSeconds(Math.round(work.durationMs / 1000));
      if (rest) setRestSeconds(Math.round(rest.durationMs / 1000));
      return;
    }

    const totalMs = preset.durationMs;
    const h = Math.floor(totalMs / (1000 * 60 * 60));
    const m = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((totalMs % (1000 * 60)) / 1000);

    setType('timer');
    setName(capitalizeWords(preset.title));
    setColor(preset.color);
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'stopwatch') {
      const rawName = name.trim() || 'Stopwatch';
      const finalName = capitalizeWords(rawName);
      const targetMs = enableTargetGoal
        ? (targetHours * 3600 + targetMinutes * 60 + targetSeconds) * 1000
        : undefined;
      onCreateStopwatch(finalName, color, targetMs && targetMs > 0 ? targetMs : undefined);
    } else if (type === 'interval') {
      const safeRounds = Math.max(1, intervalRounds || 8);
      const safeWork = Math.max(1, workSeconds || 20);
      const safeRest = Math.max(0, restSeconds || 10);
      const safePrep = Math.max(0, prepareSeconds || 0);

      const rawName = name.trim() || `HIIT (${safeWork}s / ${safeRest}s x ${safeRounds})`;
      const finalName = capitalizeWords(rawName);
      const phases: IntervalPhase[] = [];

      if (safePrep > 0) {
        phases.push({
          id: `phase-prep-${Date.now()}`,
          name: 'Get Ready',
          durationMs: safePrep * 1000,
          type: 'prepare',
          color: 'amber',
        });
      }

      phases.push({
        id: `phase-work-${Date.now()}`,
        name: 'Work Sprint',
        durationMs: safeWork * 1000,
        type: 'work',
        color: 'rose',
      });

      if (safeRest > 0) {
        phases.push({
          id: `phase-rest-${Date.now()}`,
          name: 'Rest',
          durationMs: safeRest * 1000,
          type: 'rest',
          color: 'emerald',
        });
      }

      onCreateInterval(finalName, color, safeRounds, phases, sound, voiceEnabled);
    } else {
      const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
      if (durationMs <= 0) {
        alert('Please enter a duration greater than 0 seconds.');
        return;
      }
      const rawName = name.trim() || `${minutes}m Timer`;
      const finalName = capitalizeWords(rawName);
      onCreateTimer(finalName, durationMs, color, sound, soundRepeat, overtimeEnabled, voiceEnabled);
    }

    onClose();
  };

  const handleTestSound = () => {
    soundEngine.playAlert(sound);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create New Clock</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Type Toggle Segment (3 options: Timer, Stopwatch, Interval) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('timer');
                if (!name || name.includes('Stopwatch') || name.includes('HIIT')) setName('');
              }}
              className={`py-2 px-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                if (!name || name.includes('Timer') || name.includes('HIIT')) setName('');
              }}
              className={`py-2 px-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'stopwatch'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Stopwatch</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('interval');
                if (!name || name.includes('Timer') || name.includes('Stopwatch')) setName('');
              }}
              className={`py-2 px-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'interval'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-500" />
              <span>HIIT / Interval</span>
            </button>
          </div>

          {/* Quick Presets Selection Pill Carousel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Templates
              </label>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {TIMER_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 transition-colors cursor-pointer"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Title / Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === 'timer'
                  ? 'e.g. Focus Sprint, Pasta Boiling, Laundry'
                  : type === 'interval'
                  ? 'e.g. Tabata Workout, Boxing Rounds, HIIT Cardio'
                  : 'e.g. 5K Run, Meeting Duration, Study Block'
              }
              autoCapitalize="words"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all capitalize"
            />
          </div>

          {/* 1. DURATION INPUTS FOR TIMER */}
          {type === 'timer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Countdown Duration
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={hours}
                      onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full py-2.5 text-center font-mono font-bold text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-2.5 top-3 text-[10px] text-slate-400 font-bold">H</span>
                  </div>
                  <span className="block text-[11px] text-center text-slate-500 dark:text-slate-400 mt-1">Hours</span>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-full py-2.5 text-center font-mono font-bold text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-2.5 top-3 text-[10px] text-slate-400 font-bold">M</span>
                  </div>
                  <span className="block text-[11px] text-center text-slate-500 dark:text-slate-400 mt-1">Minutes</span>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={seconds}
                      onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-full py-2.5 text-center font-mono font-bold text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-2.5 top-3 text-[10px] text-slate-400 font-bold">S</span>
                  </div>
                  <span className="block text-[11px] text-center text-slate-500 dark:text-slate-400 mt-1">Seconds</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. INTERVAL CONFIGURATION FOR HIIT */}
          {type === 'interval' && (
            <div className="space-y-4 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Interval Structure
                </span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Total Workout: {Math.round((intervalRounds * (workSeconds + restSeconds) + prepareSeconds) / 60)} mins
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Rounds
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={intervalRounds}
                    onChange={(e) => setIntervalRounds(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full py-2 text-center font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
                    Work (sec)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={workSeconds}
                    onChange={(e) => setWorkSeconds(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full py-2 text-center font-mono font-bold rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    Rest (sec)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="600"
                    value={restSeconds}
                    onChange={(e) => setRestSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-2 text-center font-mono font-bold rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                    Prep (sec)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={prepareSeconds}
                    onChange={(e) => setPrepareSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-2 text-center font-mono font-bold rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. TARGET GOAL FOR STOPWATCH */}
          {type === 'stopwatch' && (
            <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Target Time Goal (Optional)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableTargetGoal(!enableTargetGoal)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    enableTargetGoal
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {enableTargetGoal ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {enableTargetGoal && (
                <div className="grid grid-cols-3 gap-2 pt-2 animate-in fade-in">
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={targetHours}
                      onChange={(e) => setTargetHours(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="HH"
                      className="w-full py-2 text-center font-mono font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Hours</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      placeholder="MM"
                      className="w-full py-2 text-center font-mono font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Minutes</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={targetSeconds}
                      onChange={(e) => setTargetSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      placeholder="SS"
                      className="w-full py-2 text-center font-mono font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Seconds</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Color Theme Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Color Theme Accent
            </label>
            <ColorPicker selectedColor={color} onSelectColor={setColor} />
          </div>

          {/* Sound & Options for Timers/Intervals */}
          {(type === 'timer' || type === 'interval') && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    Alarm Melody
                  </label>
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Preview Sound</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(['chime', 'digital', 'bell', 'marimba', 'gentle'] as SoundPreset[]).map((snd) => (
                    <button
                      key={snd}
                      type="button"
                      onClick={() => {
                        setSound(snd);
                        soundEngine.playAlert(snd);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        sound === snd
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {snd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra toggles: Overtime Count-up & Voice Coach */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {type === 'timer' && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={overtimeEnabled}
                      onChange={(e) => setOvertimeEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                    />
                    <span>Count up (Overtime) after 00:00</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium ml-auto">
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <span>Voice Coach Cues</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create {type === 'stopwatch' ? 'Stopwatch' : type === 'interval' ? 'HIIT Sequence' : 'Timer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
