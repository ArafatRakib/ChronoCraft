import { Capacitor, registerPlugin } from '@capacitor/core';

export const ALARM_CHANNEL_ID = 'chronocraft_alarm_channel';
export const ACTIVE_TIMER_CHANNEL_ID = 'chronocraft_active_timer_channel';
export const RUNNING_NOTIFICATION_ID = 888888;

// Define typed interfaces for Capacitor Native Plugins
export interface LocalNotificationSchema {
  id: number;
  title: string;
  body: string;
  schedule?: {
    at?: Date;
    allowWhileIdle?: boolean;
  };
  channelId?: string;
  actionTypeId?: string;
  ongoing?: boolean;
  autoCancel?: boolean;
  extra?: Record<string, any>;
  sound?: string;
}

export interface ChannelSchema {
  id: string;
  name: string;
  description?: string;
  importance: number;
  visibility?: number;
  vibration?: boolean;
  lights?: boolean;
  lightColor?: string;
  sound?: string;
}

interface LocalNotificationsPlugin {
  createChannel(channel: ChannelSchema): Promise<void>;
  requestPermissions(): Promise<{ display: string }>;
  schedule(options: { notifications: LocalNotificationSchema[] }): Promise<void>;
  cancel(options: { notifications: { id: number }[] }): Promise<void>;
}

interface HapticsPlugin {
  impact(options: { style: 'HEAVY' | 'MEDIUM' | 'LIGHT' }): Promise<void>;
  notification(options: { type: 'SUCCESS' | 'WARNING' | 'ERROR' }): Promise<void>;
  vibrate(options?: { duration?: number }): Promise<void>;
}

// Safely register plugins via Capacitor core (avoids compile-time static bundle failures)
const LocalNotifications = registerPlugin<LocalNotificationsPlugin>('LocalNotifications');
const Haptics = registerPlugin<HapticsPlugin>('Haptics');

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
        // 1. High priority Alarm Channel (Importance 5 = IMPORTANCE_HIGH/MAX, bypasses silent/DND mode)
        const alarmChannel: ChannelSchema = {
          id: ALARM_CHANNEL_ID,
          name: 'Timer & Workout Alarms',
          description: 'High-priority alert channel that plays alarm sound and vibrates on timer completion',
          importance: 5, // MAX importance in Android
          visibility: 1, // VISIBILITY_PUBLIC (shows on lock screen)
          vibration: true,
          lights: true,
          lightColor: '#EF4444',
          sound: 'alarm.wav',
        };

        // 2. Active Running Timer Channel (Persistent ongoing notification)
        const activeChannel: ChannelSchema = {
          id: ACTIVE_TIMER_CHANNEL_ID,
          name: 'Active Running Timers',
          description: 'Ongoing lock screen and notification shade display for running stopwatches and timers',
          importance: 4, // IMPORTANCE_HIGH so it shows on lockscreen and status bar
          visibility: 1, // VISIBILITY_PUBLIC
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
   * Updates an ongoing native Android notification for active running stopwatches, timers, or HIIT workouts.
   * Keeps the live timer visible in the Android notification shade and lock screen.
   */
  public async updateRunningNotification(title: string, body: string): Promise<void> {
    if (!this.isNative()) return;

    try {
      await this.initialize();
      // Directly notify without AlarmManager schedule delay for instantaneous live updates
      await LocalNotifications.schedule({
        notifications: [
          {
            id: RUNNING_NOTIFICATION_ID,
            title,
            body,
            channelId: ACTIVE_TIMER_CHANNEL_ID,
            ongoing: true,
            autoCancel: false,
            actionTypeId: 'OPEN_APP',
            extra: {
              type: 'active_running_timer',
            },
          },
        ],
      });
    } catch (e) {
      console.warn('Native running notification note:', e);
    }
  }

  /**
   * Clears the ongoing running notification when all items are paused or reset
   */
  public async clearRunningNotification(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: RUNNING_NOTIFICATION_ID }],
      });
    } catch (e) {
      console.warn('Native clear running notification note:', e);
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
    if (!this.isNative()) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(style === 'alarm' ? [400, 200, 400, 200, 600] : 80);
      }
      return;
    }

    try {
      if (style === 'alarm') {
        await Haptics.notification({ type: 'ERROR' });
        setTimeout(() => Haptics.vibrate({ duration: 500 }), 200);
        setTimeout(() => Haptics.vibrate({ duration: 800 }), 800);
      } else if (style === 'heavy') {
        await Haptics.impact({ style: 'HEAVY' });
      } else if (style === 'medium') {
        await Haptics.impact({ style: 'MEDIUM' });
      } else {
        await Haptics.impact({ style: 'LIGHT' });
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
