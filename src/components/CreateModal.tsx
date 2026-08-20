import React, { useState, useEffect } from 'react';
import { ColorName, SoundPreset, TimerPreset, IntervalPhase, IntervalPhaseType } from '../types';
import { COLOR_KEYS, COLOR_THEMES, getColorTheme } from '../constants/colors';
import { ColorPicker } from './ColorPicker';
import { soundEngine } from '../utils/audio';
import { speechAssistant } from '../utils/speech';
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
  Layers,
  Trash2,
  Mic,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'stopwatch' | 'timer' | 'interval';
  defaultSound?: SoundPreset;
  defaultSoundRepeat?: number;
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

interface CustomPhaseItem {
  id: string;
  name: string;
  minutes: number;
  seconds: number;
  type: IntervalPhaseType;
  color: ColorName;
}

const INTERVAL_TEMPLATES = [
  {
    title: 'Tabata HIIT',
    desc: '20s Work / 10s Rest (8 Rounds)',
    color: 'rose' as ColorName,
    rounds: 8,
    workMin: 0,
    workSec: 20,
    workName: 'Work Sprint',
    restMin: 0,
    restSec: 10,
    restName: 'Rest',
    prepMin: 0,
    prepSec: 5,
    prepName: 'Get Ready',
  },
  {
    title: 'Boxing Championship',
    desc: '3m Round / 1m Rest (3 Rounds)',
    color: 'amber' as ColorName,
    rounds: 3,
    workMin: 3,
    workSec: 0,
    workName: 'Boxing Round',
    restMin: 1,
    restSec: 0,
    restName: 'Corner Rest',
    prepMin: 0,
    prepSec: 10,
    prepName: 'Get Ready',
  },
  {
    title: 'Pomodoro Focus',
    desc: '25m Focus / 5m Break (4 Rounds)',
    color: 'indigo' as ColorName,
    rounds: 4,
    workMin: 25,
    workSec: 0,
    workName: 'Deep Focus Sprint',
    restMin: 5,
    restSec: 0,
    restName: 'Rest & Refresh',
    prepMin: 0,
    prepSec: 0,
    prepName: '',
  },
  {
    title: 'Sprint Interval',
    desc: '45s Sprint / 15s Rest (10 Rounds)',
    color: 'orange' as ColorName,
    rounds: 10,
    workMin: 0,
    workSec: 45,
    workName: 'Full Sprint',
    restMin: 0,
    restSec: 15,
    restName: 'Active Recovery',
    prepMin: 0,
    prepSec: 5,
    prepName: 'Get Ready',
  },
  {
    title: 'Cooking & Simmer',
    desc: '15m High Sear / 45m Simmer',
    color: 'emerald' as ColorName,
    rounds: 1,
    workMin: 15,
    workSec: 0,
    workName: 'High Heat Sear',
    restMin: 45,
    restSec: 0,
    restName: 'Low Simmer',
    prepMin: 0,
    prepSec: 0,
    prepName: '',
  },
];

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  initialType = 'timer',
  defaultSound = 'chime',
  defaultSoundRepeat = 3,
  onCreateStopwatch,
  onCreateTimer,
  onCreateInterval,
}) => {
  const [type, setType] = useState<'stopwatch' | 'timer' | 'interval'>(initialType);
  const [name, setName] = useState('');
  const [color, setColor] = useState<ColorName>('indigo');
  const [sound, setSound] = useState<SoundPreset>(defaultSound);
  const [soundRepeat, setSoundRepeat] = useState<number>(defaultSoundRepeat);
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

  // Interval Mode: 'quick' vs 'custom-builder'
  const [intervalMode, setIntervalMode] = useState<'quick' | 'builder'>('quick');

  // Quick Interval settings
  const [intervalRounds, setIntervalRounds] = useState(8);
  const [workMinutes, setWorkMinutes] = useState(0);
  const [workSeconds, setWorkSeconds] = useState(20);
  const [workName, setWorkName] = useState('Work Sprint');

  const [hasRest, setHasRest] = useState(true);
  const [restMinutes, setRestMinutes] = useState(0);
  const [restSeconds, setRestSeconds] = useState(10);
  const [restName, setRestName] = useState('Rest');

  const [hasPrep, setHasPrep] = useState(true);
  const [prepMinutes, setPrepMinutes] = useState(0);
  const [prepSeconds, setPrepSeconds] = useState(5);
  const [prepName, setPrepName] = useState('Get Ready');

  // Custom Multi-Phase Builder settings
  const [builderRounds, setBuilderRounds] = useState(3);
  const [builderPhases, setBuilderPhases] = useState<CustomPhaseItem[]>([
    { id: '1', name: 'Warmup & Mobility', minutes: 3, seconds: 0, type: 'prepare', color: 'amber' },
    { id: '2', name: 'High Intensity', minutes: 1, seconds: 0, type: 'work', color: 'rose' },
    { id: '3', name: 'Active Recovery', minutes: 0, seconds: 30, type: 'rest', color: 'emerald' },
    { id: '4', name: 'Cool Down', minutes: 2, seconds: 0, type: 'rest', color: 'cyan' },
  ]);

  // Sync state whenever the modal opens or initialType changes
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setName('');
      setColor(initialType === 'interval' ? 'rose' : 'indigo');
      setSound(defaultSound || 'chime');
      setSoundRepeat(defaultSoundRepeat || 3);
      setOvertimeEnabled(true);
      setVoiceEnabled(true);
      setHours(0);
      setMinutes(5);
      setSeconds(0);
      setEnableTargetGoal(false);
      setTargetHours(0);
      setTargetMinutes(5);
      setTargetSeconds(0);

      setIntervalMode('quick');
      setIntervalRounds(8);
      setWorkMinutes(0);
      setWorkSeconds(20);
      setWorkName('Work Sprint');
      setHasRest(true);
      setRestMinutes(0);
      setRestSeconds(10);
      setRestName('Rest');
      setHasPrep(true);
      setPrepMinutes(0);
      setPrepSeconds(5);
      setPrepName('Get Ready');
    }
  }, [isOpen, initialType, defaultSound, defaultSoundRepeat]);

  if (!isOpen) return null;

  const handleApplyIntervalTemplate = (tpl: typeof INTERVAL_TEMPLATES[0]) => {
    setIntervalMode('quick');
    setName(tpl.title);
    setColor(tpl.color);
    setIntervalRounds(tpl.rounds);
    setWorkMinutes(tpl.workMin);
    setWorkSeconds(tpl.workSec);
    setWorkName(tpl.workName);
    
    if (tpl.restMin > 0 || tpl.restSec > 0) {
      setHasRest(true);
      setRestMinutes(tpl.restMin);
      setRestSeconds(tpl.restSec);
      setRestName(tpl.restName);
    } else {
      setHasRest(false);
      setRestMinutes(0);
      setRestSeconds(0);
    }

    if (tpl.prepMin > 0 || tpl.prepSec > 0) {
      setHasPrep(true);
      setPrepMinutes(tpl.prepMin);
      setPrepSeconds(tpl.prepSec);
      setPrepName(tpl.prepName);
    } else {
      setHasPrep(false);
      setPrepMinutes(0);
      setPrepSeconds(0);
    }
  };

  const handleAddBuilderPhase = () => {
    const newId = `phase-${Date.now()}`;
    setBuilderPhases((prev) => [
      ...prev,
      {
        id: newId,
        name: `Phase ${prev.length + 1}`,
        minutes: 1,
        seconds: 0,
        type: 'work',
        color: 'rose',
      },
    ]);
  };

  const handleRemoveBuilderPhase = (id: string) => {
    if (builderPhases.length <= 1) return;
    setBuilderPhases((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateBuilderPhase = (id: string, updates: Partial<CustomPhaseItem>) => {
    setBuilderPhases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // Compute total interval time
  const calculateTotalIntervalTime = (): string => {
    let totalSeconds = 0;
    if (intervalMode === 'quick') {
      const workTotal = workMinutes * 60 + workSeconds;
      const restTotal = hasRest ? restMinutes * 60 + restSeconds : 0;
      const prepTotal = hasPrep ? prepMinutes * 60 + prepSeconds : 0;
      totalSeconds = intervalRounds * (workTotal + restTotal) + prepTotal;
    } else {
      const roundSeconds = builderPhases.reduce(
        (acc, p) => acc + (p.minutes * 60 + p.seconds),
        0
      );
      totalSeconds = builderRounds * roundSeconds;
    }

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) return `${h}h ${m}m ${s > 0 ? `${s}s` : ''}`;
    if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`;
    return `${s}s`;
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
      const phases: IntervalPhase[] = [];

      if (intervalMode === 'quick') {
        const safeRounds = Math.max(1, intervalRounds || 1);
        const workDurationMs = (workMinutes * 60 + workSeconds) * 1000;
        const restDurationMs = hasRest ? (restMinutes * 60 + restSeconds) * 1000 : 0;
        const prepDurationMs = hasPrep ? (prepMinutes * 60 + prepSeconds) * 1000 : 0;

        if (workDurationMs <= 0) {
          alert('Work duration must be at least 1 second.');
          return;
        }

        if (prepDurationMs > 0) {
          phases.push({
            id: `phase-prep-${Date.now()}`,
            name: capitalizeWords(prepName.trim()) || 'Get Ready',
            durationMs: prepDurationMs,
            type: 'prepare',
            color: 'amber',
          });
        }

        phases.push({
          id: `phase-work-${Date.now()}`,
          name: capitalizeWords(workName.trim()) || 'Work Sprint',
          durationMs: workDurationMs,
          type: 'work',
          color: 'rose',
        });

        if (restDurationMs > 0) {
          phases.push({
            id: `phase-rest-${Date.now()}`,
            name: capitalizeWords(restName.trim()) || 'Rest',
            durationMs: restDurationMs,
            type: 'rest',
            color: 'emerald',
          });
        }

        const rawName =
          name.trim() ||
          `${capitalizeWords(workName)} (${workMinutes > 0 ? `${workMinutes}m` : ''}${workSeconds}s x ${safeRounds})`;
        const finalName = capitalizeWords(rawName);

        onCreateInterval(finalName, color, safeRounds, phases, sound, voiceEnabled);
      } else {
        // Multi-phase builder
        const safeRounds = Math.max(1, builderRounds || 1);
        const builtPhases: IntervalPhase[] = builderPhases.map((p, idx) => {
          const durationMs = Math.max(1000, (p.minutes * 60 + p.seconds) * 1000);
          return {
            id: `phase-custom-${Date.now()}-${idx}`,
            name: capitalizeWords(p.name.trim()) || `Phase ${idx + 1}`,
            durationMs,
            type: p.type,
            color: p.color,
          };
        });

        const rawName = name.trim() || `Custom Routine (${builderPhases.length} Phases x ${safeRounds})`;
        const finalName = capitalizeWords(rawName);

        onCreateInterval(finalName, color, safeRounds, builtPhases, sound, voiceEnabled);
      }
    } else {
      const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
      if (durationMs <= 0) {
        alert('Please enter a duration greater than 0 seconds.');
        return;
      }
      const rawName = name.trim() || `${hours > 0 ? `${hours}h ` : ''}${minutes}m Timer`;
      const finalName = capitalizeWords(rawName);
      onCreateTimer(finalName, durationMs, color, sound, soundRepeat, overtimeEnabled, voiceEnabled);
    }

    onClose();
  };

  const handleTestSound = () => {
    soundEngine.playAlert(sound);
  };

  const handleTestVoice = () => {
    speechAssistant.testVoice();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
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
          
          {/* Type Toggle Segment (Timer, Stopwatch, Interval) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('timer');
                if (!name || name.includes('Stopwatch') || name.includes('HIIT') || name.includes('Routine')) setName('');
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
                if (!name || name.includes('Timer') || name.includes('HIIT') || name.includes('Routine')) setName('');
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
              <Flame className="w-4 h-4" />
              <span>Interval / Routine</span>
            </button>
          </div>

          {/* Quick Templates for Interval Mode */}
          {type === 'interval' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Templates</span>
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {INTERVAL_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => handleApplyIntervalTemplate(tpl)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-colors whitespace-nowrap border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title / Label Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Title / Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === 'interval'
                  ? 'e.g. Tabata Workout, Boxing Rounds, Deep Work'
                  : type === 'stopwatch'
                  ? 'e.g. Morning Sprint, Lap Tracker'
                  : 'e.g. Boiling Eggs, Reading Sprint'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
          </div>

          {/* 1. TIMER DURATION PICKER */}
          {type === 'timer' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Duration (Hours : Minutes : Seconds)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-2.5 text-center font-mono font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-medium text-slate-400 mt-1">Hours</span>
                </div>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-2.5 text-center font-mono font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-medium text-slate-400 mt-1">Minutes</span>
                </div>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-2.5 text-center font-mono font-bold text-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-medium text-slate-400 mt-1">Seconds</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. INTERVAL BUILDER (Quick vs Multi-Phase Custom) */}
          {type === 'interval' && (
            <div className="space-y-4 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40">
              
              {/* Mode Selector & Total Calculated Time */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 p-0.5 bg-rose-100/60 dark:bg-rose-900/40 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIntervalMode('quick')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      intervalMode === 'quick'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Quick Interval
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntervalMode('builder')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      intervalMode === 'builder'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Custom Multi-Phase
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                    Total: {calculateTotalIntervalTime()}
                  </span>
                </div>
              </div>

              {/* QUICK INTERVAL CONFIG */}
              {intervalMode === 'quick' && (
                <div className="space-y-3.5 pt-1">
                  {/* Rounds */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Total Rounds
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Repetitions</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={intervalRounds}
                      onChange={(e) => setIntervalRounds(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full py-2 px-3 text-center font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* 1. Work / Active Phase */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Work / Active Phase</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={workName}
                        onChange={(e) => setWorkName(e.target.value)}
                        placeholder="Phase Name (e.g. Work Sprint, Boxing)"
                        className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                      />
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={workMinutes}
                            onChange={(e) => setWorkMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full py-1.5 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400"
                          />
                          <span className="text-[10px] text-slate-400 font-semibold">min</span>
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={workSeconds}
                            onChange={(e) => setWorkSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full py-1.5 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400"
                          />
                          <span className="text-[10px] text-slate-400 font-semibold">sec</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Rest / Recovery Phase */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Rest / Recovery Phase</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setHasRest(!hasRest)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          hasRest ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {hasRest ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {hasRest && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                        <input
                          type="text"
                          value={restName}
                          onChange={(e) => setRestName(e.target.value)}
                          placeholder="Phase Name (e.g. Rest, Short Break)"
                          className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                        />
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={restMinutes}
                              onChange={(e) => setRestMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full py-1.5 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">min</span>
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={restSeconds}
                              onChange={(e) => setRestSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full py-1.5 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">sec</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Prep / Countdown Phase */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-amber-200 dark:border-amber-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Prep / Warmup Phase</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setHasPrep(!hasPrep)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          hasPrep ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {hasPrep ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    {hasPrep && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                        <input
                          type="text"
                          value={prepName}
                          onChange={(e) => setPrepName(e.target.value)}
                          placeholder="Phase Name (e.g. Get Ready)"
                          className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                        />
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={prepMinutes}
                              onChange={(e) => setPrepMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full py-1.5 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">min</span>
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={prepSeconds}
                              onChange={(e) => setPrepSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full py-1.5 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">sec</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CUSTOM MULTI-PHASE BUILDER */}
              {intervalMode === 'builder' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Routine Multiplier
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Repeat entire routine</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={builderRounds}
                      onChange={(e) => setBuilderRounds(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full py-2 px-3 text-center font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {builderPhases.map((phase, idx) => (
                      <div
                        key={phase.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => handleUpdateBuilderPhase(phase.id, { name: e.target.value })}
                          placeholder="Phase Name"
                          className="flex-1 min-w-0 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                        />

                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={phase.minutes}
                            onChange={(e) =>
                              handleUpdateBuilderPhase(phase.id, {
                                minutes: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-10 py-1 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                          <span className="text-[10px] text-slate-400">m</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={phase.seconds}
                            onChange={(e) =>
                              handleUpdateBuilderPhase(phase.id, {
                                seconds: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-10 py-1 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                          <span className="text-[10px] text-slate-400">s</span>
                        </div>

                        {builderPhases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBuilderPhase(phase.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBuilderPhase}
                    className="w-full py-2 rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Custom Phase</span>
                  </button>
                </div>
              )}
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
                      onChange={(e) => setTargetMinutes(Math.max(0, parseInt(e.target.value) || 0))}
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
                      onChange={(e) => setTargetSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="SS"
                      className="w-full py-2 text-center font-mono font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Seconds</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Color Theme Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Color Theme Accent
            </label>
            <ColorPicker selectedColor={color} onSelectColor={setColor} />
          </div>

          {/* Sound Melody Selector */}
          {type !== 'stopwatch' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Alarm Melody</span>
                </label>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Preview Sound</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'chime' as SoundPreset, label: 'Chime' },
                  { id: 'digital' as SoundPreset, label: 'Digital' },
                  { id: 'bell' as SoundPreset, label: 'Bell' },
                  { id: 'marimba' as SoundPreset, label: 'Marimba' },
                  { id: 'gentle' as SoundPreset, label: 'Gentle' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSound(s.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      sound === s.id
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600 ring-offset-1 dark:ring-offset-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voice Coach Cue Toggle */}
          {type !== 'stopwatch' && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Voice Coach Cues</span>
                </span>
              </label>

              {voiceEnabled && (
                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Test Voice</span>
                </button>
              )}
            </div>
          )}

          {/* Overtime count toggle for Timer */}
          {type === 'timer' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={overtimeEnabled}
                onChange={(e) => setOvertimeEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span>Count elapsed overtime when finished</span>
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Create {type === 'interval' ? 'Interval' : type === 'stopwatch' ? 'Stopwatch' : 'Timer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
