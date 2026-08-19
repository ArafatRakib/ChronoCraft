/**
 * Background Notification & Lock Screen MediaSession Service
 * Keeps active stopwatches, timers, and HIIT intervals visible in the
 * Android/iOS lock screen, notification shade, and browser status.
 */

export interface ActiveItemSummary {
  id: string;
  name: string;
  type: 'stopwatch' | 'timer' | 'interval';
  formattedTime: string;
  isRunning: boolean;
  isCompleted?: boolean;
  phaseName?: string;
  currentRound?: number;
  totalRounds?: number;
}

// 1-second silent WAV base64 data URI to keep MediaSession alive in background
const SILENT_AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

class BackgroundNotificationService {
  private audioElement: HTMLAudioElement | null = null;
  private isAudioPlaying = false;
  private lastUpdateMs = 0;
  private currentActiveItem: ActiveItemSummary | null = null;
  private onPlayCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onSkipCallback: (() => void) | null = null;
  private onResetCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
      this.initMediaSession();
    }
  }

  private initAudioElement() {
    try {
      this.audioElement = new Audio(SILENT_AUDIO_DATA_URI);
      this.audioElement.loop = true;
      this.audioElement.volume = 0.01;
    } catch (e) {
      console.warn('Audio element init for background media session failed', e);
    }
  }

  private initMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (this.onPlayCallback) this.onPlayCallback();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (this.onPauseCallback) this.onPauseCallback();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        if (this.onResetCallback) this.onResetCallback();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.onSkipCallback) this.onSkipCallback();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.onResetCallback) this.onResetCallback();
      });
    } catch (e) {
      console.warn('MediaSession handler registration warning', e);
    }
  }

  public registerActionCallbacks(callbacks: {
    onPlay?: () => void;
    onPause?: () => void;
    onSkip?: () => void;
    onReset?: () => void;
  }) {
    this.onPlayCallback = callbacks.onPlay || null;
    this.onPauseCallback = callbacks.onPause || null;
    this.onSkipCallback = callbacks.onSkip || null;
    this.onResetCallback = callbacks.onReset || null;
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Updates lock screen and notification shade state with currently running item
   */
  public update(primaryItem: ActiveItemSummary | null, anyRunning: boolean) {
    this.currentActiveItem = primaryItem;

    if (typeof window === 'undefined') return;

    // 1. Manage background silent audio player
    if (anyRunning) {
      if (this.audioElement && !this.isAudioPlaying) {
        this.audioElement.play().then(() => {
          this.isAudioPlaying = true;
        }).catch(() => {
          // Auto-play policy might require user gesture, will succeed on next click
        });
      }
    } else {
      if (this.audioElement && this.isAudioPlaying) {
        this.audioElement.pause();
        this.isAudioPlaying = false;
      }
    }

    // 2. Manage MediaSession (Lock screen & Notification shade card)
    if ('mediaSession' in navigator) {
      if (primaryItem && anyRunning) {
        let artist = 'ChronoCraft Timer';
        if (primaryItem.type === 'stopwatch') {
          artist = '⏱️ Stopwatch Running';
        } else if (primaryItem.type === 'interval') {
          artist = `🔥 HIIT: ${primaryItem.phaseName || 'Work'} (Round ${primaryItem.currentRound || 1}/${primaryItem.totalRounds || 8})`;
        } else {
          artist = '⏳ Countdown Timer Active';
        }

        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `${primaryItem.name} — ${primaryItem.formattedTime}`,
            artist,
            album: 'ChronoCraft Time Suite',
            artwork: [
              {
                src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                sizes: '192x192',
                type: 'image/svg+xml',
              },
            ],
          });
          navigator.mediaSession.playbackState = 'playing';
        } catch {}
      } else if (primaryItem && !anyRunning) {
        try {
          navigator.mediaSession.playbackState = 'paused';
        } catch {}
      } else {
        try {
          navigator.mediaSession.playbackState = 'none';
        } catch {}
      }
    }

    // 3. Document title synchronization
    if (primaryItem && anyRunning) {
      document.title = `(${primaryItem.formattedTime}) ${primaryItem.name} • ChronoCraft`;
    } else {
      document.title = 'ChronoCraft • Multi-Timer, Stopwatch & HIIT Suite';
    }

    // 4. Native Notification in background
    const now = Date.now();
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState === 'hidden' &&
      primaryItem &&
      anyRunning
    ) {
      // Throttle notification updates to once every 2.5s to prevent notification drawer flickering
      if (now - this.lastUpdateMs > 2500) {
        this.lastUpdateMs = now;
        try {
          new Notification(`${primaryItem.name}: ${primaryItem.formattedTime}`, {
            body: primaryItem.type === 'interval' 
              ? `${primaryItem.phaseName || 'Phase'} • Round ${primaryItem.currentRound}/${primaryItem.totalRounds}`
              : 'Timer is actively running in background',
            tag: 'chronocraft-active-timer',
            silent: true,
            icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="%234f46e5"><circle cx="12" cy="12" r="10"/></svg>',
          });
        } catch {}
      }
    }
  }

  /**
   * Fires a high-priority completion notification when a timer or workout ends
   */
  public notifyCompletion(title: string, message: string) {
    if (typeof window === 'undefined') return;

    // Vibration API
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 400]);
      } catch {}
    }

    // High priority system notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`⏰ ${title}`, {
          body: message,
          tag: 'chronocraft-alarm',
          requireInteraction: true,
          icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="%23ef4444"><circle cx="12" cy="12" r="10"/></svg>',
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch {}
    }
  }
}

export const backgroundNotificationService = new BackgroundNotificationService();
