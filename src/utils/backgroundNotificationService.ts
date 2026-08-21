/**
 * Background Notification & Lock Screen MediaSession Service
 * Keeps active stopwatches, timers, and HIIT intervals visible in the
 * Android/iOS lock screen, notification shade, and browser status.
 */

import { capacitorBridge } from './capacitorNativeBridge';

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

/**
 * Creates a valid, well-formed 2-second 8kHz mono 16-bit PCM silent WAV data URI
 */
function createValidSilentWavDataUri(): string {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const durationSec = 2;
  const numSamples = sampleRate * durationSec;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  // Silence: array buffer is initialized to 0
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

class BackgroundNotificationService {
  private audioElement: HTMLAudioElement | null = null;
  private isAudioPlaying = false;
  private isAudioUnlocked = false;
  private lastNotificationKey = '';
  private swRegistration: ServiceWorkerRegistration | null = null;
  private onPlayCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onSkipCallback: (() => void) | null = null;
  private onResetCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initServiceWorker();
      this.initAudioElement();
      this.initMediaSession();
      this.setupAutoUnlockOnFirstInteraction();
    }
  }

  private initServiceWorker() {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          this.swRegistration = reg;
        })
        .catch(() => {
          // Non-critical, fallback to standard notification
        });
    }
  }

  private initAudioElement() {
    try {
      const silentUri = createValidSilentWavDataUri();
      this.audioElement = new Audio(silentUri);
      this.audioElement.loop = true;
      this.audioElement.volume = 0.01;
    } catch (e) {
      console.warn('Audio element init for background media session failed', e);
    }
  }

  private setupAutoUnlockOnFirstInteraction() {
    const unlock = () => {
      this.unlockAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { passive: true, once: true });
  }

  public unlockAudio() {
    if (this.isAudioUnlocked) return;
    this.isAudioUnlocked = true;
    if (this.audioElement) {
      this.audioElement
        .play()
        .then(() => {
          this.isAudioPlaying = true;
        })
        .catch(() => {});
    }
  }

  private initMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (this.audioElement) {
          this.audioElement.play().catch(() => {});
          this.isAudioPlaying = true;
        }
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

  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  public async requestNotificationPermission(): Promise<boolean> {
    this.unlockAudio();

    if (capacitorBridge.isNative()) {
      return await capacitorBridge.requestPermissions();
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Updates lock screen and native notifications for active clocks
   */
  // src/utils/backgroundNotificationService.ts

// Add a public helper to reset notification key state
public resetNotificationState() {
  this.lastNotificationKey = '';
}

public update(items: ActiveItemSummary[] | ActiveItemSummary | null, anyRunning: boolean) {
  if (typeof window === 'undefined') return;

  const itemList = Array.isArray(items) ? items : items ? [items] : [];
  const primaryItem = itemList[0] || null;

  // 1. Audio focus management
  if (anyRunning) {
    if (this.audioElement && !this.isAudioPlaying) {
      this.audioElement
        .play()
        .then(() => {
          this.isAudioPlaying = true;
        })
        .catch(() => {});
    }
  } else {
    if (this.audioElement && this.isAudioPlaying) {
      this.audioElement.pause();
      this.isAudioPlaying = false;
    }
  }

  // 2. Web MediaSession Metadata
  if ('mediaSession' in navigator) {
    if (primaryItem && anyRunning) {
      let artist = 'ChronoCraft Suite';
      if (primaryItem.type === 'stopwatch') {
        artist = '⏱️ Stopwatch Running';
      } else if (primaryItem.type === 'interval') {
        artist = `🔥 HIIT: ${primaryItem.phaseName || 'Phase'} (Round ${primaryItem.currentRound || 1}/${primaryItem.totalRounds || 8})`;
      } else {
        artist = '⏳ Timer Running';
      }

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${primaryItem.name} — ${primaryItem.formattedTime}`,
          artist,
          album: 'ChronoCraft Time Suite',
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

  // 3. Native Android Chronometer Notifications
  if (anyRunning && itemList.length > 0) {
    const activeIdsKey = itemList.map((i) => i.id).sort().join(',');

    // Force update if key changed or state was explicitly reset
    if (this.lastNotificationKey !== activeIdsKey) {
      this.lastNotificationKey = activeIdsKey;

      if (capacitorBridge.isNative()) {
        itemList.forEach((item) => {
          let baseTimeMs = Date.now();
          let isCountDown = false;

          if (item.type === 'timer') {
            const parts = item.formattedTime.split(':').map(Number);
            const totalSec = parts.length === 3 
              ? parts[0] * 3600 + parts[1] * 60 + parts[2]
              : parts[0] * 60 + parts[1];
            baseTimeMs = Date.now() + totalSec * 1000;
            isCountDown = true;
          } else {
            const parts = item.formattedTime.split('.');
            const mainParts = parts[0].split(':').map(Number);
            const elapsedSec = mainParts.length === 3 
              ? mainParts[0] * 3600 + mainParts[1] * 60 + mainParts[2]
              : mainParts[0] * 60 + mainParts[1];
            baseTimeMs = Date.now() - elapsedSec * 1000;
            isCountDown = false;
          }

          const labelText = item.type === 'interval' 
            ? `HIIT • ${item.phaseName || 'Work'} (R${item.currentRound}/${item.totalRounds})`
            : `${item.type.toUpperCase()} • Active`;

          capacitorBridge.updateRunningChronometer(
            item.id,
            item.name,
            labelText,
            baseTimeMs,
            isCountDown
          );
        });
      }
    }
  } else if (!anyRunning) {
    if (this.lastNotificationKey !== '') {
      this.lastNotificationKey = '';
      if (capacitorBridge.isNative()) {
        capacitorBridge.clearRunningChronometer(undefined, true);
      }
    }
  }
}


  /**
   * Fires a high-priority completion notification & vibration when a timer or workout ends
   */
  public notifyCompletion(title: string, message: string) {
    if (typeof window === 'undefined') return;

    // 1. Native Capacitor Android completion notification (Early return prevents duplicate web notification)
    if (capacitorBridge.isNative()) {
      capacitorBridge.triggerImmediateAlarm(title, message);
      return;
    }

    // 2. Strong repeating vibration pattern for web browser mode
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([500, 200, 500, 200, 1000]);
      } catch {}
    }

    // 3. Web Service Worker or System Notification Fallback
    const notificationTag = `chronocraft-completion-${title.replace(/\s+/g, '-').toLowerCase()}`;

    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      this.swRegistration.showNotification(`⏰ ${title}`, {
        body: message,
        tag: notificationTag,
        requireInteraction: true,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="%23ef4444"><circle cx="12" cy="12" r="10"/></svg>',
      } as NotificationOptions);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`⏰ ${title}`, {
          body: message,
          tag: notificationTag,
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
