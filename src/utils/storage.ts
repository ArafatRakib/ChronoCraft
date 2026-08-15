import { StopwatchItem, TimerItem } from '../types';

const STOPWATCHES_KEY = 'chrono_stopwatches_v1';
const TIMERS_KEY = 'chrono_timers_v1';
const THEME_KEY = 'chrono_theme_v1';

export function loadStopwatches(): StopwatchItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STOPWATCHES_KEY);
    if (raw === null) return null;
    const items: StopwatchItem[] = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch {
    return null;
  }
}

export function saveStopwatches(items: StopwatchItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STOPWATCHES_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save stopwatches', e);
  }
}

export function loadTimers(): TimerItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TIMERS_KEY);
    if (raw === null) return null;
    const items: TimerItem[] = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch {
    return null;
  }
}

export function saveTimers(items: TimerItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TIMERS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save timers', e);
  }
}

export function loadSavedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // default based on system
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // fallback
  }
  return 'dark';
}

export function saveTheme(theme: 'light' | 'dark') {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme', e);
  }
}

/**
 * Calculates current elapsed time for a stopwatch taking Date.now() into account
 */
export function getStopwatchElapsed(sw: StopwatchItem, now: number = Date.now()): number {
  if (!sw.isRunning || !sw.startedAt) {
    return sw.accumulatedTime;
  }
  return sw.accumulatedTime + Math.max(0, now - sw.startedAt);
}

/**
 * Calculates current remaining time for a timer taking Date.now() into account
 */
export function getTimerRemaining(timer: TimerItem, now: number = Date.now()): number {
  if (!timer.isRunning || !timer.startedAt) {
    return timer.remainingTime;
  }
  const elapsedSinceStart = Math.max(0, now - timer.startedAt);
  const rem = timer.remainingTime - elapsedSinceStart;
  return Math.max(0, rem);
}
