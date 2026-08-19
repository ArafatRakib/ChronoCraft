/**
 * Media Session API integration for Lock Screen and Notification Shade controls
 */

export interface MediaSessionCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  onLap?: () => void;
}

export interface MediaSessionOptions {
  title: string;
  artist?: string;
  album?: string;
  isRunning: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onLap?: () => void;
}

class MediaSessionManager {
  private silentAudio: HTMLAudioElement | null = null;
  private isInitialized = false;
  private currentCallbacks: MediaSessionCallbacks = {};

  private initSilentAudio() {
    if (this.isInitialized || typeof window === 'undefined') return;
    try {
      // 1-second silent WAV base64 data URI
      const silentWav =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      this.silentAudio = new Audio(silentWav);
      this.silentAudio.loop = true;
      this.isInitialized = true;
    } catch {}
  }

  public updateSession(options: MediaSessionOptions): void;
  public updateSession(title: string, stateText: string, isRunning: boolean, callbacks: MediaSessionCallbacks): void;
  public updateSession(
    first: string | MediaSessionOptions,
    stateText?: string,
    isRunning?: boolean,
    callbacks?: MediaSessionCallbacks
  ) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    let titleStr: string;
    let artistStr = 'ChronoCraft';
    let runningBool = false;
    let cb: MediaSessionCallbacks = {};

    if (typeof first === 'object') {
      titleStr = first.title;
      artistStr = first.artist || 'ChronoCraft';
      runningBool = first.isRunning;
      cb = {
        onPlay: first.onPlay,
        onPause: first.onPause,
        onStop: first.onReset,
        onReset: first.onReset,
        onLap: first.onLap,
      };
    } else {
      titleStr = first;
      artistStr = stateText || 'ChronoCraft';
      runningBool = Boolean(isRunning);
      cb = callbacks || {};
    }

    this.currentCallbacks = cb;
    this.initSilentAudio();

    try {
      // Update Lock screen artwork & title
      navigator.mediaSession.metadata = new MediaMetadata({
        title: titleStr,
        artist: artistStr,
        album: 'ChronoCraft Suite',
      });

      // Bind actions
      const actions: [MediaSessionAction, (() => void) | undefined][] = [
        ['play', () => {
          this.playSilent();
          this.currentCallbacks.onPlay?.();
        }],
        ['pause', () => {
          this.pauseSilent();
          this.currentCallbacks.onPause?.();
        }],
        ['stop', () => {
          this.pauseSilent();
          if (this.currentCallbacks.onStop) {
            this.currentCallbacks.onStop();
          } else if (this.currentCallbacks.onReset) {
            this.currentCallbacks.onReset();
          }
        }],
        ['nexttrack', () => {
          this.currentCallbacks.onLap?.();
        }],
        ['previoustrack', () => {
          this.pauseSilent();
          if (this.currentCallbacks.onStop) {
            this.currentCallbacks.onStop();
          } else if (this.currentCallbacks.onReset) {
            this.currentCallbacks.onReset();
          }
        }],
      ];

      actions.forEach(([action, handler]) => {
        try {
          if (handler) {
            navigator.mediaSession.setActionHandler(action, handler);
          } else {
            navigator.mediaSession.setActionHandler(action, null);
          }
        } catch {}
      });

      if (runningBool) {
        navigator.mediaSession.playbackState = 'playing';
        this.playSilent();
      } else {
        navigator.mediaSession.playbackState = 'paused';
        this.pauseSilent();
      }
    } catch {}
  }

  private playSilent() {
    if (this.silentAudio && this.silentAudio.paused) {
      this.silentAudio.play().catch(() => {});
    }
  }

  private pauseSilent() {
    if (this.silentAudio && !this.silentAudio.paused) {
      this.silentAudio.pause();
    }
  }

  public clear() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = 'none';
      this.pauseSilent();
    } catch {}
  }

  public stopSession() {
    this.clear();
  }
}

export const mediaSessionManager = new MediaSessionManager();
