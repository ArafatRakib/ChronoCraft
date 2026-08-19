export interface FormattedTime {
  hours: string;
  minutes: string;
  seconds: string;
  centiseconds: string;
  totalSeconds: number;
}

/**
 * Converts milliseconds into formatted time components.
 * Fully guarded against NaN, null, undefined, and negative numbers.
 */
export function formatTime(ms: number | undefined | null): FormattedTime {
  const safeMs = typeof ms === 'number' && !isNaN(ms) ? Math.max(0, Math.floor(ms)) : 0;
  
  const hoursNum = Math.floor(safeMs / (1000 * 60 * 60));
  const minutesNum = Math.floor((safeMs % (1000 * 60 * 60)) / (1000 * 60));
  const secondsNum = Math.floor((safeMs % (1000 * 60)) / 1000);
  const centisecondsNum = Math.floor((safeMs % 1000) / 10);

  return {
    hours: hoursNum < 10 ? `0${hoursNum}` : `${hoursNum}`,
    minutes: minutesNum < 10 ? `0${minutesNum}` : `${minutesNum}`,
    seconds: secondsNum < 10 ? `0${secondsNum}` : `${secondsNum}`,
    centiseconds: centisecondsNum < 10 ? `0${centisecondsNum}` : `${centisecondsNum}`,
    totalSeconds: Math.floor(safeMs / 1000),
  };
}

/**
 * Returns a display string e.g. "01:23:45.67" or "23:45.67" or "01:23:45"
 */
export function formatTimeString(ms: number | undefined | null, showMs: boolean = true): string {
  const t = formatTime(ms);
  const hasHours = parseInt(t.hours, 10) > 0;
  
  let base = `${hasHours ? t.hours + ':' : ''}${t.minutes}:${t.seconds}`;
  if (showMs) {
    base += `.${t.centiseconds}`;
  }
  return base;
}

/**
 * Parses hours, minutes, seconds numbers to total milliseconds
 */
export function durationToMs(hours: number = 0, minutes: number = 0, seconds: number = 0): number {
  const h = isNaN(hours) ? 0 : Math.max(0, hours);
  const m = isNaN(minutes) ? 0 : Math.max(0, minutes);
  const s = isNaN(seconds) ? 0 : Math.max(0, seconds);
  return (h * 3600 + m * 60 + s) * 1000;
}

/**
 * Formats a duration in ms to human concise string like "25 min" or "1h 30m 15s"
 */
export function formatDurationHuman(ms: number | undefined | null): string {
  const { hours, minutes, seconds } = formatTime(ms);
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  const s = parseInt(seconds, 10);

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}s`);

  return parts.join(' ');
}
