import { StopwatchItem, TimerItem, IntervalTimerItem, TimerPreset, IntervalPhase, SoundPreset } from '../types';
import { capitalizeWords } from './textFormatters';

const STOPWATCHES_KEY = 'chrono_stopwatches_v1';
const TIMERS_KEY = 'chrono_timers_v1';
const INTERVALS_KEY = 'chrono_intervals_v1';
const CUSTOM_PRESETS_KEY = 'chrono_custom_presets_v1';
const THEME_KEY = 'chrono_theme_v1';
const WAKELOCK_PREF_KEY = 'chrono_wakelock_pref_v1';
const VOICE_PREF_KEY = 'chrono_voice_pref_v1';
const GLOBAL_SOUND_PREF_KEY = 'chrono_global_sound_v1';
const GLOBAL_SOUND_REPEAT_PREF_KEY = 'chrono_global_sound_repeat_v1';

export function loadGlobalSoundPreference(): SoundPreset {
  if (typeof window === 'undefined') return 'chime';
  try {
    const sound = localStorage.getItem(GLOBAL_SOUND_PREF_KEY);
    if (sound === 'digital' || sound === 'chime' || sound === 'bell' || sound === 'marimba' || sound === 'gentle') {
      return sound;
    }
  } catch {}
  return 'chime';
}

export function saveGlobalSoundPreference(sound: SoundPreset) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GLOBAL_SOUND_PREF_KEY, sound);
  } catch {}
}

export function loadGlobalSoundRepeatPreference(): number {
  if (typeof window === 'undefined') return 3;
  try {
    const raw = localStorage.getItem(GLOBAL_SOUND_REPEAT_PREF_KEY);
    if (raw !== null) {
      const val = parseInt(raw, 10);
      if (val === 1 || val === 3 || val === 5 || val === 0) {
        return val;
      }
    }
  } catch {}
  return 3;
}

export function saveGlobalSoundRepeatPreference(repeat: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GLOBAL_SOUND_REPEAT_PREF_KEY, repeat.toString());
  } catch {}
}

export function loadStopwatches(): StopwatchItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STOPWATCHES_KEY);
    if (raw === null) return null;
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.map((sw: any) => ({
      ...sw,
      name: capitalizeWords(sw.name || 'Stopwatch'),
      accumulatedTime: typeof sw.accumulatedTime === 'number' && !isNaN(sw.accumulatedTime) ? Math.max(0, sw.accumulatedTime) : 0,
      laps: Array.isArray(sw.laps) ? sw.laps : [],
    }));
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
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.map((t: any) => ({
      ...t,
      name: capitalizeWords(t.name || 'Timer'),
      duration: typeof t.duration === 'number' && !isNaN(t.duration) ? Math.max(1000, t.duration) : 60000,
      remainingTime: typeof t.remainingTime === 'number' && !isNaN(t.remainingTime) ? Math.max(0, t.remainingTime) : (t.duration || 60000),
    }));
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

export function loadIntervals(): IntervalTimerItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(INTERVALS_KEY);
    if (raw === null) return null;
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    
    return items.map((inv: any) => {
      // Validate and sanitize phases
      let phases: IntervalPhase[] = [];
      if (Array.isArray(inv.phases) && inv.phases.length > 0) {
        phases = inv.phases.map((p: any, idx: number) => ({
          id: p.id || `phase-${idx}-${Date.now()}`,
          name: capitalizeWords(p.name || (p.type === 'work' ? 'Work' : p.type === 'rest' ? 'Rest' : 'Phase')),
          durationMs: typeof p.durationMs === 'number' && !isNaN(p.durationMs) && p.durationMs > 0 
            ? p.durationMs 
            : typeof p.duration === 'number' && !isNaN(p.duration) 
              ? p.duration 
              : 20000,
          type: p.type || 'work',
          color: p.color || (p.type === 'work' ? 'rose' : 'emerald'),
        }));
      } else {
        phases = [
          { id: `phase-work-${Date.now()}`, name: 'Work', durationMs: 20000, type: 'work', color: 'rose' },
          { id: `phase-rest-${Date.now()}`, name: 'Rest', durationMs: 10000, type: 'rest', color: 'emerald' },
        ];
      }

      const currentPhaseIndex = typeof inv.currentPhaseIndex === 'number' && !isNaN(inv.currentPhaseIndex) && inv.currentPhaseIndex >= 0 && inv.currentPhaseIndex < phases.length
        ? inv.currentPhaseIndex
        : 0;

      const currentPhase = phases[currentPhaseIndex] || phases[0];
      const defaultDuration = currentPhase ? currentPhase.durationMs : 20000;

      const phaseRemainingMs = typeof inv.phaseRemainingMs === 'number' && !isNaN(inv.phaseRemainingMs) && inv.phaseRemainingMs >= 0
        ? inv.phaseRemainingMs
        : defaultDuration;

      return {
        ...inv,
        name: capitalizeWords(inv.name || 'HIIT Interval'),
        currentRound: typeof inv.currentRound === 'number' && !isNaN(inv.currentRound) && inv.currentRound >= 1 ? inv.currentRound : 1,
        totalRounds: typeof inv.totalRounds === 'number' && !isNaN(inv.totalRounds) && inv.totalRounds >= 1 ? inv.totalRounds : 8,
        currentPhaseIndex,
        phases,
        phaseRemainingMs,
        isRunning: Boolean(inv.isRunning),
        isCompleted: Boolean(inv.isCompleted),
      };
    });
  } catch {
    return null;
  }
}

export function saveIntervals(items: IntervalTimerItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INTERVALS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save intervals', e);
  }
}

export const loadIntervalTimers = loadIntervals;
export const saveIntervalTimers = saveIntervals;

export function loadCustomPresets(): TimerPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (raw === null) return [];
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.map((p: any) => ({
      ...p,
      title: capitalizeWords(p.title || 'Custom Preset'),
      category: capitalizeWords(p.category || 'Custom'),
      durationMs: typeof p.durationMs === 'number' && !isNaN(p.durationMs) ? Math.max(1000, p.durationMs) : 60000,
    }));
  } catch {
    return [];
  }
}

export function saveCustomPresets(items: TimerPreset[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save custom presets', e);
  }
}

export function loadWakeLockPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(WAKELOCK_PREF_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveWakeLockPreference(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WAKELOCK_PREF_KEY, String(enabled));
  } catch {}
}

export function loadVoicePreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(VOICE_PREF_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveVoicePreference(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_PREF_KEY, String(enabled));
  } catch {}
}

export function loadSavedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {}
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
  if (!sw) return 0;
  const safeAccumulated = typeof sw.accumulatedTime === 'number' && !isNaN(sw.accumulatedTime) ? Math.max(0, sw.accumulatedTime) : 0;
  if (!sw.isRunning || !sw.startedAt) {
    return safeAccumulated;
  }
  return safeAccumulated + Math.max(0, now - sw.startedAt);
}

/**
 * Calculates current remaining time for a timer taking Date.now() into account
 */
export function getTimerRemaining(timer: TimerItem, now: number = Date.now()): number {
  if (!timer) return 0;
  const safeRemaining = typeof timer.remainingTime === 'number' && !isNaN(timer.remainingTime) ? Math.max(0, timer.remainingTime) : 0;
  if (!timer.isRunning || !timer.startedAt) {
    return safeRemaining;
  }
  const elapsedSinceStart = Math.max(0, now - timer.startedAt);
  const rem = safeRemaining - elapsedSinceStart;
  return Math.max(0, rem);
}

/**
 * Calculates interval state including remaining phase time
 */
export function getIntervalState(
  inv: IntervalTimerItem, 
  now: number = Date.now()
): { remainingPhaseMs: number; isCompleted: boolean } {
  if (!inv) return { remainingPhaseMs: 0, isCompleted: true };
  if (inv.isCompleted) {
    return { remainingPhaseMs: 0, isCompleted: true };
  }

  const currentPhase = (inv.phases && inv.phases.length > 0)
    ? (inv.phases[inv.currentPhaseIndex] || inv.phases[0])
    : { durationMs: 20000 };
  const phaseDuration = (currentPhase && typeof currentPhase.durationMs === 'number' && !isNaN(currentPhase.durationMs))
    ? currentPhase.durationMs
    : 20000;

  const currentRemaining = typeof inv.phaseRemainingMs === 'number' && !isNaN(inv.phaseRemainingMs)
    ? inv.phaseRemainingMs
    : phaseDuration;

  if (!inv.isRunning || !inv.startedAt) {
    return { remainingPhaseMs: Math.max(0, currentRemaining), isCompleted: false };
  }
  const elapsed = Math.max(0, now - inv.startedAt);
  const remaining = Math.max(0, currentRemaining - elapsed);
  return { remainingPhaseMs: remaining, isCompleted: false };
}

/**
 * Calculates overtime elapsed ms for completed timers
 */
export function getOvertimeElapsed(timer: TimerItem, now: number = Date.now()): number {
  if (!timer || !timer.isCompleted) return 0;
  if (timer.startedAt && timer.isRunning) {
    return Math.max(0, now - timer.startedAt);
  }
  return typeof timer.overtimeMs === 'number' && !isNaN(timer.overtimeMs) ? Math.max(0, timer.overtimeMs) : 0;
}
