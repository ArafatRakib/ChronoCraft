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
  isCompleted: boolean;
  createdAt: number;
}

export type ActiveTab = 'all' | 'stopwatches' | 'timers';
export type ViewLayout = 'grid' | 'compact';
export type SoundPreset = 'chime' | 'digital' | 'bell' | 'marimba' | 'gentle';

export interface TimerPreset {
  id: string;
  title: string;
  category: string;
  durationMs: number;
  color: ColorName;
  iconName?: string;
}
