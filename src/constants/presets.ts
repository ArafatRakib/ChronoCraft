import { TimerPreset } from '../types';

export const TIMER_PRESETS: TimerPreset[] = [
  // Productivity
  {
    id: 'pomodoro',
    title: 'Pomodoro Focus',
    category: 'Productivity',
    durationMs: 25 * 60 * 1000,
    color: 'indigo',
    iconName: 'Brain',
  },
  {
    id: 'short-break',
    title: 'Short Break',
    category: 'Productivity',
    durationMs: 5 * 60 * 1000,
    color: 'blue',
    iconName: 'Coffee',
  },
  {
    id: 'long-break',
    title: 'Long Break',
    category: 'Productivity',
    durationMs: 15 * 60 * 1000,
    color: 'violet',
    iconName: 'Armchair',
  },
  // Interval Workouts
  {
    id: 'interval-tabata',
    title: 'Tabata Protocol (20s / 10s)',
    category: 'Fitness',
    durationMs: 4 * 60 * 1000,
    color: 'rose',
    iconName: 'Flame',
    intervalConfig: {
      rounds: 8,
      phases: [
        { name: 'Work Sprint', durationMs: 20 * 1000, type: 'work', color: 'rose' },
        { name: 'Rest & Breathe', durationMs: 10 * 1000, type: 'rest', color: 'emerald' },
      ],
    },
  },
  {
    id: 'interval-boxing',
    title: 'Boxing Championship (3m / 1m)',
    category: 'Fitness',
    durationMs: 15 * 60 * 1000,
    color: 'amber',
    iconName: 'Flame',
    intervalConfig: {
      rounds: 3,
      phases: [
        { name: 'Boxing Round', durationMs: 3 * 60 * 1000, type: 'work', color: 'amber' },
        { name: 'Corner Rest', durationMs: 60 * 1000, type: 'rest', color: 'blue' },
      ],
    },
  },
  {
    id: 'interval-hiit-sprint',
    title: 'HIIT Sprint (45s / 15s)',
    category: 'Fitness',
    durationMs: 10 * 60 * 1000,
    color: 'coral',
    iconName: 'Flame',
    intervalConfig: {
      rounds: 10,
      phases: [
        { name: 'High Intensity', durationMs: 45 * 1000, type: 'work', color: 'coral' },
        { name: 'Active Recovery', durationMs: 15 * 1000, type: 'rest', color: 'cyan' },
      ],
    },
  },
  // Wellness & Kitchen
  {
    id: 'meditation',
    title: '10m Mindfulness',
    category: 'Wellness',
    durationMs: 10 * 60 * 1000,
    color: 'emerald',
    iconName: 'Sparkles',
  },
  {
    id: 'tea-timer',
    title: 'Tea Steeping',
    category: 'Kitchen',
    durationMs: 3 * 60 * 1000 + 30 * 1000,
    color: 'amber',
    iconName: 'CupSoda',
  },
  {
    id: 'boil-egg',
    title: 'Soft Boiled Egg',
    category: 'Kitchen',
    durationMs: 6 * 60 * 1000 + 30 * 1000,
    color: 'coral',
    iconName: 'Utensils',
  },
];
