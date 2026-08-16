import { SoundPreset } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Track active repeating/looping alarms per timerId
  private activeAlarms: Map<string, { intervalId: ReturnType<typeof setInterval>; repeatsLeft: number }> = new Map();

  public playAlert(preset: SoundPreset = 'chime') {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (preset) {
      case 'chime': {
        // High harmonic chime
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.65);
        });
        break;
      }

      case 'digital': {
        // Classic digital alarm beep beep beep
        const freqs = [880, 880, 880];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);

          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.15 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.12);
        });
        break;
      }

      case 'bell': {
        // Resonant bell chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(293.66, now + 1.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
        break;
      }

      case 'marimba': {
        // Warm marimba 4-note motif
        const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          gain.gain.setValueAtTime(0.35, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.45);
        });
        break;
      }

      case 'gentle': {
        // Calming major chord fade
        const chord = [329.63, 415.3, 493.88, 659.25]; // E4, G#4, B4, E5
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.8);
        });
        break;
      }
    }
  }

  /**
   * Start an alarm for a timer with optional repeating/looping
   * repeatCount: 1 (play once), 3 (repeat 3x), 5 (repeat 5x), 0 (continuous loop until dismissed)
   */
  public startAlarm(timerId: string, preset: SoundPreset = 'chime', repeatCount: number = 3) {
    this.stopAlarm(timerId);

    // Play first iteration immediately
    this.playAlert(preset);

    if (repeatCount === 1) {
      return;
    }

    let repeatsRemaining = repeatCount === 0 ? Infinity : repeatCount - 1;

    const intervalId = setInterval(() => {
      if (repeatsRemaining <= 0) {
        this.stopAlarm(timerId);
        return;
      }
      this.playAlert(preset);
      if (repeatsRemaining !== Infinity) {
        repeatsRemaining -= 1;
      }
    }, 1800);

    this.activeAlarms.set(timerId, {
      intervalId,
      repeatsLeft: repeatsRemaining,
    });
  }

  /**
   * Stops repeating/continuous alarm for a specific timer (or all active alarms if timerId is omitted)
   */
  public stopAlarm(timerId?: string) {
    if (timerId) {
      const active = this.activeAlarms.get(timerId);
      if (active) {
        clearInterval(active.intervalId);
        this.activeAlarms.delete(timerId);
      }
    } else {
      this.activeAlarms.forEach((alarm) => clearInterval(alarm.intervalId));
      this.activeAlarms.clear();
    }
  }

  // Quick unlock method triggered on first click anywhere
  public unlock() {
    this.getAudioContext();
  }
}

export const soundEngine = new SoundEngine();
