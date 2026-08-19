/**
 * Screen Wake Lock utility to keep screen awake during timers/workouts
 */
class WakeLockManager {
  private wakeLock: any = null;
  private isRequested: boolean = false;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRequested) {
          this.request();
        }
      });
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  public async request(): Promise<boolean> {
    this.isRequested = true;
    if (!this.isSupported()) return false;

    try {
      if (!this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  public async requestWakeLock(): Promise<boolean> {
    return this.request();
  }

  public async release(): Promise<void> {
    this.isRequested = false;
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }

  public async releaseWakeLock(): Promise<void> {
    return this.release();
  }

  public isActive(): boolean {
    return this.wakeLock !== null;
  }
}

export const wakeLockManager = new WakeLockManager();
