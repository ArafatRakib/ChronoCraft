import { Capacitor } from '@capacitor/core';
import { LocalNotifications, Channel } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const ALARM_CHANNEL_ID = 'chronocraft_alarm_channel';
export const ACTIVE_TIMER_CHANNEL_ID = 'chronocraft_active_timer_channel';

class CapacitorNativeBridge {
  private isInitialized = false;

  public isNative(): boolean {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
  }

  public isAndroid(): boolean {
    return this.isNative() && Capacitor.getPlatform() === 'android';
  }

  /**
   * Initializes native Android notification channels with high-priority ALARM attributes
   */
  public async initialize(): Promise<void> {
    if (!this.isNative() || this.isInitialized) return;

    try {
      if (this.isAndroid()) {
        // 1. High priority Alarm Channel (Importance 5 = IMPORTANCE_HIGH/MAX, bypasses silent/DND mode, plays alarm sound)
        const alarmChannel: Channel = {
          id: ALARM_CHANNEL_ID,
          name: 'Timer & Workout Alarms',
          description: 'High-priority alert channel that plays alarm sound and vibrates on timer completion',
          importance: 5, // MAX importance in Android
          visibility: 1, // VISIBILITY_PUBLIC (shows on lock screen)
          vibration: true,
          lights: true,
          lightColor: '#EF4444',
          sound: 'alarm.wav', // Native sound resource or default alarm
        };

        // 2. Active Running Timer Channel (Persistent ongoing notification)
        const activeChannel: Channel = {
          id: ACTIVE_TIMER_CHANNEL_ID,
          name: 'Active Running Timers',
          description: 'Ongoing lock screen and notification shade display for running stopwatches and timers',
          importance: 3, // IMPORTANCE_DEFAULT
          visibility: 1,
          vibration: false,
          lights: false,
        };

        await LocalNotifications.createChannel(alarmChannel).catch(() => {});
        await LocalNotifications.createChannel(activeChannel).catch(() => {});
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('Capacitor native bridge initialization note:', e);
    }
  }

  /**
   * Requests native notification permissions from Android OS
   */
  public async requestPermissions(): Promise<boolean> {
    if (!this.isNative()) return false;

    try {
      const res = await LocalNotifications.requestPermissions();
      await this.initialize();
      return res.display === 'granted';
    } catch (e) {
      console.warn('Native permission request note:', e);
      return false;
    }
  }

  /**
   * Schedules an exact native Android background alarm for when a timer finishes.
   * Uses Android AlarmManager (allowWhileIdle: true) so it fires even if the app is closed or in Doze mode.
   */
  public async scheduleAlarm(
    numericId: number,
    title: string,
    body: string,
    triggerDate: Date
  ): Promise<void> {
    if (!this.isNative()) return;

    try {
      await this.initialize();
      // Ensure any previous alarm for this ID is removed first
      await this.cancelAlarm(numericId);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: `⏰ ${title}`,
            body,
            schedule: {
              at: triggerDate,
              allowWhileIdle: true, // Wakes Android CPU from Doze mode (Exact Alarm)
            },
            channelId: ALARM_CHANNEL_ID,
            actionTypeId: 'OPEN_APP',
            extra: {
              type: 'timer_completion',
            },
          },
        ],
      });
    } catch (e) {
      console.warn('Native alarm schedule note:', e);
    }
  }

  /**
   * Cancels a scheduled native alarm (e.g. when paused or reset)
   */
  public async cancelAlarm(numericId: number): Promise<void> {
    if (!this.isNative()) return;

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: numericId }],
      });
    } catch (e) {
      console.warn('Native alarm cancel note:', e);
    }
  }

  /**
   * Fires an immediate high-priority native notification with vibration and sound
   */
  public async triggerImmediateAlarm(title: string, body: string): Promise<void> {
    if (!this.isNative()) return;

    try {
      await this.initialize();
      const randomId = Math.floor(Math.random() * 100000) + 1;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: randomId,
            title: `⏰ ${title}`,
            body,
            schedule: { at: new Date(Date.now() + 50) },
            channelId: ALARM_CHANNEL_ID,
          },
        ],
      });
      await this.triggerHaptic('alarm');
    } catch (e) {
      console.warn('Native immediate alarm note:', e);
    }
  }

  /**
   * Native device haptic feedback
   */
  public async triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'alarm'): Promise<void> {
    if (!this.isNative()) return;

    try {
      if (style === 'alarm') {
        await Haptics.notification({ type: NotificationType.Error });
        setTimeout(() => Haptics.vibrate({ duration: 500 }), 200);
        setTimeout(() => Haptics.vibrate({ duration: 800 }), 800);
      } else if (style === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (style === 'medium') {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch {
      // Fallback to web vibration
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(style === 'alarm' ? [400, 200, 400, 200, 600] : 80);
      }
    }
  }
}

export const capacitorBridge = new CapacitorNativeBridge();
