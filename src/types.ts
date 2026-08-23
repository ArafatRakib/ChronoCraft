export type ColorName = 
  | 'blue' 
  | 'emerald' 
  | 'violet' 
  | 'rose' 
  | 'amber' 
  | 'cyan' 
  | 'indigo' 
  | 'coral'
  | string;

export interface ColorTheme {
  name: ColorName;
  label: string;
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  accentHex: string;
  glow: string;
  badge: string;
}

export interface LapItem {
  id: string;
  number: number;
  totalTime: number; // in ms
  lapTime: number; // in ms
  timestamp: number;
}

export interface StopwatchItem {
  id: string;
  name: string;
  color: ColorName;
  isRunning: boolean;
  startedAt: number | null; // Date.now() when started/resumed
  accumulatedTime: number; // ms spent running before current startedAt
  laps: LapItem[];
  targetGoalMs?: number; // Optional target time goal (e.g. 5m, 10m)
  targetReachedNotified?: boolean;
  createdAt: number;
}

export interface TimerItem {
  id: string;
  name: string;
  color: ColorName;
  isRunning: boolean;
  startedAt: number | null; // Date.now() when last started
  duration: number; // target duration in ms
  remainingTime: number; // remaining duration in ms when paused
  soundAlert: SoundPreset;
  soundRepeat?: number; // 1 = once, 3 = 3x, 5 = 5x, 0 = continuous loop until dismissed
  overtimeEnabled?: boolean; // Count up after 00:00
  overtimeMs?: number; // Elapsed ms since 00:00
  voiceEnabled?: boolean; // Web speech announcements (halfway, 1m, 30s, finish)
  isCompleted: boolean;
  createdAt: number;
}

export type IntervalPhaseType = 'prepare' | 'work' | 'rest' | 'cooldown';

export interface IntervalPhase {
  id: string;
  name: string;
  durationMs: number;
  type: IntervalPhaseType;
  color: ColorName;
}

export interface IntervalTimerItem {
  id: string;
  name: string;
  color: ColorName;
  isRunning: boolean;
  startedAt: number | null; // Date.now()
  totalRounds: number;
  currentRound: number; // 1-indexed
  currentPhaseIndex: number; // 0-indexed in phases array
  phases: IntervalPhase[];
  phaseStartedAt?: number | null;
  phaseRemainingMs: number;
  soundAlert: SoundPreset;
  voiceEnabled?: boolean;
  isCompleted: boolean;
  createdAt: number;
}

export type ActiveTab = 'all' | 'stopwatches' | 'timers' | 'intervals';
export type ViewLayout = 'grid' | 'compact';
export type SoundPreset = 'chime' | 'digital' | 'bell' | 'marimba' | 'gentle';

export interface TimerPreset {
  id: string;
  title: string;
  category: string;
  durationMs: number;
  color: ColorName;
  iconName?: string;
  isCustom?: boolean;
  clockType?: 'stopwatch' | 'timer' | 'interval';
  targetGoalMs?: number;
  intervalConfig?: {
    rounds: number;
    phases: {
      id?: string;
      name: string;
      durationMs: number;
      type: 'prepare' | 'work' | 'rest' | 'cooldown';
      color: ColorName;
    }[];
  };
}
