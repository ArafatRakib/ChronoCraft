/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  StopwatchItem, 
  TimerItem, 
  IntervalTimerItem, 
  IntervalPhase,
  ActiveTab, 
  ColorName, 
  SoundPreset, 
  TimerPreset 
} from './types';
import { 
  loadStopwatches, 
  saveStopwatches, 
  loadTimers, 
  saveTimers, 
  loadIntervals,
  saveIntervals,
  loadCustomPresets,
  saveCustomPresets,
  loadWakeLockPreference,
  saveWakeLockPreference,
  loadVoicePreference,
  saveVoicePreference,
  loadGlobalSoundPreference,
  saveGlobalSoundPreference,
  loadGlobalSoundRepeatPreference,
  saveGlobalSoundRepeatPreference,
  getStopwatchElapsed, 
  getTimerRemaining,
  getIntervalState
} from './utils/storage';
import { capitalizeWords } from './utils/textFormatters';
import { formatTime } from './utils/timeFormatter';
import { soundEngine } from './utils/audio';
import { speechManager } from './utils/speech';
import { wakeLockManager } from './utils/wakeLock';
import { backgroundNotificationService, ActiveItemSummary } from './utils/backgroundNotificationService';
import { capacitorBridge } from './utils/capacitorNativeBridge';
import { Navbar } from './components/Navbar';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { StopwatchCard } from './components/StopwatchCard';
import { TimerCard } from './components/TimerCard';
import { IntervalCard } from './components/IntervalCard';
import { CreateModal } from './components/CreateModal';
import { FocusModal } from './components/FocusModal';
import { PresetsModal } from './components/PresetsModal';
import { LapAnalyticsModal } from './components/LapAnalyticsModal';
import { SettingsModal } from './components/SettingsModal';
import { EmptyState } from './components/EmptyState';
import { ColorFilterDropdown } from './components/ColorFilterDropdown';
import { 
  Search, 
  Clock, 
  Timer as TimerIcon, 
  Flame,
  LayoutGrid, 
  List 
} from 'lucide-react';

export default function App() {
  // 1. Stopwatches State
  const [stopwatches, setStopwatches] = useState<StopwatchItem[]>(() => {
    const saved = loadStopwatches();
    if (saved !== null) return saved;
    return [
      {
        id: 'sw-default-1',
        name: 'Sprint & Laps Stopwatch',
        color: 'emerald',
        isRunning: false,
        startedAt: null,
        accumulatedTime: 0,
        laps: [],
        createdAt: Date.now(),
      },
    ];
  });

  // 2. Timers State
  const [timers, setTimers] = useState<TimerItem[]>(() => {
    const saved = loadTimers();
    if (saved !== null) return saved;
    return [
      {
        id: 'timer-default-1',
        name: 'Pomodoro Focus Timer',
        color: 'indigo',
        isRunning: false,
        startedAt: null,
        duration: 25 * 60 * 1000,
        remainingTime: 25 * 60 * 1000,
        soundAlert: 'chime',
        isCompleted: false,
        overtimeEnabled: true,
        voiceEnabled: true,
        createdAt: Date.now(),
      },
    ];
  });

  // 3. Interval Timers State
  const [intervals, setIntervals] = useState<IntervalTimerItem[]>(() => {
    const saved = loadIntervals();
    if (saved !== null) return saved;
    return [
      {
        id: 'interval-default-1',
        name: 'Tabata HIIT Workout',
        color: 'rose',
        isRunning: false,
        startedAt: null,
        currentRound: 1,
        totalRounds: 8,
        currentPhaseIndex: 0,
        phases: [
          { id: 'p1', name: 'Work Sprint', durationMs: 20 * 1000, type: 'work', color: 'rose' },
          { id: 'p2', name: 'Rest', durationMs: 10 * 1000, type: 'rest', color: 'emerald' },
        ],
        phaseRemainingMs: 20 * 1000,
        soundAlert: 'bell',
        voiceEnabled: true,
        isCompleted: false,
        createdAt: Date.now(),
      },
    ];
  });

  // 4. Custom Presets State
  const [customPresets, setCustomPresets] = useState<TimerPreset[]>(() => loadCustomPresets());

  // Preferences & Layout
  const [wakeLockPref, setWakeLockPref] = useState<boolean>(() => loadWakeLockPreference());
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => loadVoicePreference());
  const [globalSound, setGlobalSound] = useState<SoundPreset>(() => loadGlobalSoundPreference());
  const [globalSoundRepeat, setGlobalSoundRepeat] = useState<number>(() => loadGlobalSoundRepeatPreference());
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'compact'>('grid');
  const [isMuted, setIsMuted] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<'stopwatch' | 'timer' | 'interval'>('timer');
  const [editingClock, setEditingClock] = useState<StopwatchItem | TimerItem | IntervalTimerItem | null>(null);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [analyticsStopwatchId, setAnalyticsStopwatchId] = useState<string | null>(null);

  // Current timestamp tick for UI updates
  const [now, setNow] = useState(Date.now());

  // Refs for tracking transitions and preventing double alerts
  const firedTimerIds = useRef<Set<string>>(new Set());
  const halfwayNotifiedTimers = useRef<Set<string>>(new Set());
  const reachedTargetGoals = useRef<Set<string>>(new Set());
  const lastPhaseKey = useRef<Map<string, string>>(new Map());

  // Initialize Capacitor Native Channels on app start
  useEffect(() => {
    capacitorBridge.initialize();
  }, []);

  // Unlock web audio on first click
  useEffect(() => {
    const handleGlobalClick = () => {
      soundEngine.unlock();
    };
    window.addEventListener('click', handleGlobalClick, { once: true });
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Sync Voice Preference with Speech Manager
  useEffect(() => {
    speechManager.setEnabled(voiceEnabled && !isMuted);
    saveVoicePreference(voiceEnabled);
  }, [voiceEnabled, isMuted]);

  // Sync Wake Lock Preference & Activation
  const anyRunning = 
    stopwatches.some((s) => s.isRunning) || 
    timers.some((t) => t.isRunning) || 
    intervals.some((i) => i.isRunning);

  useEffect(() => {
    saveWakeLockPreference(wakeLockPref);
    if (wakeLockPref && anyRunning) {
      wakeLockManager.requestWakeLock().then((active) => setWakeLockActive(active));
    } else {
      wakeLockManager.releaseWakeLock();
      setWakeLockActive(false);
    }
  }, [wakeLockPref, anyRunning]);

      // Keep ongoing Lock Screen & Notification shade in sync with running items
  useEffect(() => {
    const runningStopwatches = stopwatches.filter((s) => s.isRunning);
    const runningTimers = timers.filter((t) => t.isRunning);
    const runningIntervals = intervals.filter((i) => i.isRunning);

    const isAnyRunning = runningStopwatches.length > 0 || runningTimers.length > 0 || runningIntervals.length > 0;

    if (!isAnyRunning) {
      backgroundNotificationService.update([], false);
      return;
    }

    const activeList: ActiveItemSummary[] = [];

    // 1. Process all running Stopwatches
    runningStopwatches.forEach((sw) => {
      const elapsed = getStopwatchElapsed(sw, now);
      const timeFmt = formatTime(elapsed);
      const formattedTime = parseInt(timeFmt.hours, 10) > 0
        ? `${timeFmt.hours}:${timeFmt.minutes}:${timeFmt.seconds}`
        : `${timeFmt.minutes}:${timeFmt.seconds}.${timeFmt.centiseconds}`;

      activeList.push({
        id: sw.id,
        name: sw.name,
        type: 'stopwatch',
        formattedTime,
        isRunning: true,
      });
    });

    // 2. Process all running Timers
    runningTimers.forEach((t) => {
      const rem = getTimerRemaining(t, now);
      const timeFmt = formatTime(rem);
      const formattedTime = parseInt(timeFmt.hours, 10) > 0
        ? `${timeFmt.hours}:${timeFmt.minutes}:${timeFmt.seconds}`
        : `${timeFmt.minutes}:${timeFmt.seconds}`;

      activeList.push({
        id: t.id,
        name: t.name,
        type: 'timer',
        formattedTime,
        isRunning: true,
      });
    });

    // 3. Process all running HIIT Intervals
    runningIntervals.forEach((inv) => {
      const activePhase = inv.phases[inv.currentPhaseIndex] || inv.phases[0];
      const elapsed = inv.startedAt ? now - inv.startedAt : 0;
      const rem = Math.max(0, inv.phaseRemainingMs - elapsed);
      const timeFmt = formatTime(rem);

      activeList.push({
        id: inv.id,
        name: inv.name,
        type: 'interval',
        formattedTime: `${timeFmt.minutes}:${timeFmt.seconds}`,
        isRunning: true,
        phaseName: activePhase.name,
        currentRound: inv.currentRound,
        totalRounds: inv.totalRounds,
      });
    });

    backgroundNotificationService.update(activeList, true);
  }, [now, stopwatches, timers, intervals]);
  
  // Main High Precision Ticker Loop (50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

            // 1. Check Stopwatches for Target Time Goals
      stopwatches.forEach((sw) => {
        if (sw.isRunning && sw.targetGoalMs && sw.targetGoalMs > 0) {
          const elapsed = getStopwatchElapsed(sw, currentNow);
          if (elapsed >= sw.targetGoalMs && !reachedTargetGoals.current.has(sw.id)) {
            reachedTargetGoals.current.add(sw.id);

            const targetTime = formatTime(sw.targetGoalMs);
            const hoursNum = parseInt(targetTime.hours, 10);
            const minutesNum = parseInt(targetTime.minutes, 10);
            const secondsNum = parseInt(targetTime.seconds, 10);

            let targetText = '';
            if (hoursNum > 0) targetText += `${hoursNum} ${hoursNum === 1 ? 'hour' : 'hours'} `;
            if (minutesNum > 0) targetText += `${minutesNum} ${minutesNum === 1 ? 'minute' : 'minutes'} `;
            if (secondsNum > 0 || (hoursNum === 0 && minutesNum === 0)) {
              targetText += `${secondsNum} ${secondsNum === 1 ? 'second' : 'seconds'}`;
            }

            backgroundNotificationService.notifyCompletion(
              `Goal Reached: ${sw.name}`,
              `Target of ${targetText.trim()} completed!`
            );
            if (!isMuted) {
              soundEngine.playTargetReached();
              if (voiceEnabled) {
                speechManager.speak(`Target goal of ${targetText.trim()} reached on ${sw.name}!`);
              }
            }
          }
        }
      });

      // 2. Check Timers for Halfway Voice Cues & Expirations
      setTimers((prevTimers) => {
        let hasChanges = false;
        const updated = prevTimers.map((t) => {
          if (t.isRunning && t.startedAt) {
            const elapsed = currentNow - t.startedAt;
            const remaining = t.remainingTime - elapsed;

            // Halfway voice cue
            if (t.voiceEnabled !== false && voiceEnabled && !isMuted) {
              const halfDuration = t.duration / 2;
              if (t.duration >= 10000 && remaining <= halfDuration && !halfwayNotifiedTimers.current.has(t.id)) {
                halfwayNotifiedTimers.current.add(t.id);
                speechManager.announceHalfway(t.name);
              }
            }

            if (remaining <= 0) {
              hasChanges = true;
              if (!firedTimerIds.current.has(t.id)) {
                firedTimerIds.current.add(t.id);
                backgroundNotificationService.notifyCompletion(
                  `Time's Up: ${t.name}`,
                  'Your timer has finished!'
                );
                if (!isMuted) {
                  soundEngine.startAlarm(t.id, t.soundAlert, t.soundRepeat !== undefined ? t.soundRepeat : 3);
                  if (t.voiceEnabled !== false && voiceEnabled) {
                    speechManager.announceTimerFinished(t.name);
                  }
                }
              }

              return {
                ...t,
                isRunning: t.overtimeEnabled !== false, // keep running if overtime enabled!
                startedAt: t.overtimeEnabled !== false ? t.startedAt : null,
                remainingTime: 0,
                isCompleted: true,
              };
            }
          }
          return t;
        });

        return hasChanges ? updated : prevTimers;
      });

      // 3. Check Interval Timers for Phase Transitions & Finishes
      setIntervals((prevIntervals) => {
        let hasChanges = false;
        const updated = prevIntervals.map((inv) => {
          if (!inv.isRunning || !inv.startedAt || inv.isCompleted) return inv;

          const activePhase = inv.phases[inv.currentPhaseIndex] || inv.phases[0];
          const elapsed = currentNow - inv.startedAt;
          const remaining = inv.phaseRemainingMs - elapsed;

          // Countdown pips at 3, 2, 1 seconds
          const sec = Math.ceil(remaining / 1000);
          if (sec > 0 && sec <= 3) {
            const pipKey = `${inv.id}-${inv.currentRound}-${inv.currentPhaseIndex}-${sec}`;
            if (!lastPhaseKey.current.has(pipKey)) {
              lastPhaseKey.current.set(pipKey, 'true');
              if (!isMuted) {
                soundEngine.playCountdownPip(sec);
                if (inv.voiceEnabled !== false && voiceEnabled) {
                  speechManager.announceCountdown(sec);
                }
              }
            }
          }

          if (remaining <= 0) {
            hasChanges = true;
            const isLastPhase = inv.currentPhaseIndex >= inv.phases.length - 1;
            const isLastRound = inv.currentRound >= inv.totalRounds;

            if (isLastPhase && isLastRound) {
              // Workout completed!
              backgroundNotificationService.notifyCompletion(
                `Workout Complete: ${inv.name}`,
                `All ${inv.totalRounds} rounds finished!`
              );
              if (!isMuted) {
                soundEngine.playAlert(inv.soundAlert);
                if (inv.voiceEnabled !== false && voiceEnabled) {
                  speechManager.speak(`Workout completed! Great job!`);
                }
              }
              return {
                ...inv,
                isRunning: false,
                startedAt: null,
                phaseRemainingMs: 0,
                isCompleted: true,
              };
            }

            // Advance Phase or Advance Round
            let nextPhaseIndex = inv.currentPhaseIndex + 1;
            let nextRound = inv.currentRound;

            if (nextPhaseIndex >= inv.phases.length) {
              nextPhaseIndex = 0;
              nextRound += 1;
            }

            const nextPhase = inv.phases[nextPhaseIndex];
            if (!isMuted) {
              soundEngine.playPhaseTransition(nextPhase.type === 'work');
              if (inv.voiceEnabled !== false && voiceEnabled) {
                speechManager.announcePhase(nextPhase.name, nextRound, inv.totalRounds);
              }
            }

            return {
              ...inv,
              currentRound: nextRound,
              currentPhaseIndex: nextPhaseIndex,
              startedAt: currentNow,
              phaseRemainingMs: nextPhase.durationMs,
            };
          }

          return inv;
        });

        return hasChanges ? updated : prevIntervals;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isMuted, voiceEnabled, stopwatches]);

  // Persist state updates to storage
  useEffect(() => {
    saveStopwatches(stopwatches);
  }, [stopwatches]);

  useEffect(() => {
    saveTimers(timers);
  }, [timers]);

  useEffect(() => {
    saveIntervals(intervals);
  }, [intervals]);

  useEffect(() => {
    saveCustomPresets(customPresets);
  }, [customPresets]);

  // ==========================================
  // STOPWATCH ACTIONS
  // ==========================================
  const handleStartStopwatch = (id: string) => {
    backgroundNotificationService.requestNotificationPermission();
    setStopwatches((prev) =>
      prev.map((sw) => (sw.id === id ? { ...sw, isRunning: true, startedAt: Date.now() } : sw))
    );
  };

  const handlePauseStopwatch = (id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.id === id && sw.isRunning && sw.startedAt) {
          const currentElapsed = sw.accumulatedTime + (Date.now() - sw.startedAt);
          return { ...sw, isRunning: false, startedAt: null, accumulatedTime: currentElapsed };
        }
        return sw;
      })
    );
  };

  const handleResetStopwatch = (id: string) => {
    reachedTargetGoals.current.delete(id);
    setStopwatches((prev) =>
      prev.map((sw) =>
        sw.id === id ? { ...sw, isRunning: false, startedAt: null, accumulatedTime: 0, laps: [] } : sw
      )
    );
  };

  const handleAddLap = (id: string) => {
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.id === id && sw.isRunning) {
          const currentTotal = getStopwatchElapsed(sw, Date.now());
          const previousLapsTotal = sw.laps.length > 0 ? sw.laps[sw.laps.length - 1].totalTime : 0;
          const lapTime = Math.max(0, currentTotal - previousLapsTotal);

          const newLap = {
            id: `lap-${Date.now()}-${sw.laps.length + 1}`,
            number: sw.laps.length + 1,
            totalTime: currentTotal,
            lapTime: lapTime,
            timestamp: Date.now(),
          };

          return { ...sw, laps: [...sw.laps, newLap] };
        }
        return sw;
      })
    );
  };

  const handleUpdateStopwatchName = (id: string, name: string) => {
    const formatted = capitalizeWords(name);
    setStopwatches((prev) => prev.map((sw) => (sw.id === id ? { ...sw, name: formatted || sw.name } : sw)));
  };

  const handleUpdateStopwatchColor = (id: string, color: ColorName) => {
    setStopwatches((prev) => prev.map((sw) => (sw.id === id ? { ...sw, color } : sw)));
  };

  const handleUpdateTargetGoal = (id: string, targetGoalMs?: number) => {
    reachedTargetGoals.current.delete(id);
    setStopwatches((prev) => prev.map((sw) => (sw.id === id ? { ...sw, targetGoalMs } : sw)));
  };

    const handleFullUpdateStopwatch = (id: string, name: string, color: ColorName, targetGoalMs?: number) => {
    reachedTargetGoals.current.delete(id);
    setStopwatches((prev) =>
      prev.map((sw) => (sw.id === id ? { ...sw, name, color, targetGoalMs } : sw))
    );
  };

  const handleDeleteStopwatch = (id: string) => {
    setStopwatches((prev) => prev.filter((sw) => sw.id !== id));
    if (focusId === id) setFocusId(null);
    if (analyticsStopwatchId === id) setAnalyticsStopwatchId(null);
  };

  // Safe 32-bit positive integer for Capacitor LocalNotifications ID
  const getNumericId = (idStr: string): number => {
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = (hash << 5) - hash + idStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 2147483647;
  };

  // ==========================================
  // TIMER ACTIONS
  // ==========================================
  const handleStartTimer = (id: string) => {
    soundEngine.stopAlarm(id);
    firedTimerIds.current.delete(id);
    backgroundNotificationService.requestNotificationPermission();

    const targetTimer = timers.find((t) => t.id === id);
    if (targetTimer) {
      const remaining = getTimerRemaining(targetTimer, Date.now());
      if (remaining > 0) {
        capacitorBridge.scheduleAlarm(
          getNumericId(id),
          targetTimer.name,
          "Time's up! Your countdown has finished.",
          new Date(Date.now() + remaining)
        );
      }
    }

    setTimers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, isRunning: true, startedAt: Date.now(), isCompleted: false } : t
      )
    );
  };

  const handlePauseTimer = (id: string) => {
    soundEngine.stopAlarm(id);
    capacitorBridge.cancelAlarm(getNumericId(id));
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id && t.isRunning && t.startedAt) {
          const currentRemaining = getTimerRemaining(t, Date.now());
          return { ...t, isRunning: false, startedAt: null, remainingTime: currentRemaining };
        }
        return t;
      })
    );
  };

  const handleResetTimer = (id: string) => {
    soundEngine.stopAlarm(id);
    capacitorBridge.cancelAlarm(getNumericId(id));
    firedTimerIds.current.delete(id);
    halfwayNotifiedTimers.current.delete(id);
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isRunning: false,
              startedAt: null,
              remainingTime: t.duration,
              isCompleted: false,
            }
          : t
      )
    );
  };

  const handleAddExtraTime = (id: string, extraMs: number) => {
    soundEngine.stopAlarm(id);
    firedTimerIds.current.delete(id);
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const currentRem = getTimerRemaining(t, Date.now());
          const newRem = currentRem + extraMs;
          const newDuration = Math.max(t.duration, newRem);

          if (t.isRunning) {
            capacitorBridge.scheduleAlarm(
              getNumericId(id),
              t.name,
              "Time's up! Your countdown has finished.",
              new Date(Date.now() + newRem)
            );
          }

          return {
            ...t,
            duration: newDuration,
            remainingTime: newRem,
            startedAt: t.isRunning ? Date.now() : null,
            isCompleted: false,
          };
        }
        return t;
      })
    );
  };

  const handleToggleTimerOvertime = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, overtimeEnabled: t.overtimeEnabled === false } : t))
    );
  };

  const handleToggleTimerVoice = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, voiceEnabled: t.voiceEnabled === false } : t))
    );
  };

  const handleUpdateTimerName = (id: string, name: string) => {
    const formatted = capitalizeWords(name);
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, name: formatted || t.name } : t)));
  };

  const handleUpdateTimerColor = (id: string, color: ColorName) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
  };

  const handleUpdateTimerSound = (id: string, soundAlert: SoundPreset) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, soundAlert } : t)));
  };

  const handleUpdateTimerRepeat = (id: string, soundRepeat: number) => {
    setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, soundRepeat } : t)));
  };

    const handleFullUpdateTimer = (
    id: string,
    name: string,
    durationMs: number,
    color: ColorName,
    soundAlert: SoundPreset,
    soundRepeat?: number,
    overtimeEnabled?: boolean,
    voiceEnabledPref?: boolean
  ) => {
    soundEngine.stopAlarm(id);
    capacitorBridge.cancelAlarm(getNumericId(id));
    firedTimerIds.current.delete(id);
    halfwayNotifiedTimers.current.delete(id);

    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            name,
            duration: durationMs,
            remainingTime: t.isRunning ? Math.min(t.remainingTime, durationMs) : durationMs,
            color,
            soundAlert,
            soundRepeat: soundRepeat !== undefined ? soundRepeat : t.soundRepeat,
            overtimeEnabled: overtimeEnabled !== undefined ? overtimeEnabled : t.overtimeEnabled,
            voiceEnabled: voiceEnabledPref !== undefined ? voiceEnabledPref : t.voiceEnabled,
          };
        }
        return t;
      })
    );
  };

  const handleDeleteTimer = (id: string) => {
    soundEngine.stopAlarm(id);
    capacitorBridge.cancelAlarm(getNumericId(id));
    firedTimerIds.current.delete(id);
    halfwayNotifiedTimers.current.delete(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
    if (focusId === id) setFocusId(null);
  };

  // ==========================================
  // INTERVAL ACTIONS
  // ==========================================
  const handleStartInterval = (id: string) => {
    backgroundNotificationService.requestNotificationPermission();
    setIntervals((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, isRunning: true, startedAt: Date.now() } : inv))
    );
  };

  const handlePauseInterval = (id: string) => {
    setIntervals((prev) =>
      prev.map((inv) => {
        if (inv.id === id && inv.isRunning && inv.startedAt) {
          const { remainingPhaseMs } = getIntervalState(inv, Date.now());
          return { ...inv, isRunning: false, startedAt: null, phaseRemainingMs: remainingPhaseMs };
        }
        return inv;
      })
    );
  };

  const handleResetInterval = (id: string) => {
    setIntervals((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const firstPhase = inv.phases[0];
          return {
            ...inv,
            isRunning: false,
            startedAt: null,
            currentRound: 1,
            currentPhaseIndex: 0,
            phaseRemainingMs: firstPhase ? firstPhase.durationMs : 20000,
            isCompleted: false,
          };
        }
        return inv;
      })
    );
  };

  const handleSkipIntervalPhase = (id: string) => {
    setIntervals((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        let nextPhase = inv.currentPhaseIndex + 1;
        let nextRound = inv.currentRound;
        if (nextPhase >= inv.phases.length) {
          nextPhase = 0;
          nextRound += 1;
        }
        if (nextRound > inv.totalRounds) {
          return { ...inv, isRunning: false, isCompleted: true };
        }
        const targetPhase = inv.phases[nextPhase];
        return {
          ...inv,
          currentRound: nextRound,
          currentPhaseIndex: nextPhase,
          startedAt: inv.isRunning ? Date.now() : null,
          phaseRemainingMs: targetPhase ? targetPhase.durationMs : 20000,
        };
      })
    );
  };

  const handleUpdateIntervalName = (id: string, name: string) => {
    const formatted = capitalizeWords(name);
    setIntervals((prev) => prev.map((inv) => (inv.id === id ? { ...inv, name: formatted || inv.name } : inv)));
  };

    const handleUpdateIntervalColor = (id: string, color: ColorName) => {
    setIntervals((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const updatedPhases = [...inv.phases];
        if (updatedPhases[inv.currentPhaseIndex]) {
          updatedPhases[inv.currentPhaseIndex] = {
            ...updatedPhases[inv.currentPhaseIndex],
            color,
          };
        }
        return { ...inv, phases: updatedPhases };
      })
    );
  };

  const handleToggleIntervalVoice = (id: string) => {
    setIntervals((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, voiceEnabled: inv.voiceEnabled === false } : inv))
    );
  };

    const handleFullUpdateInterval = (
    id: string,
    name: string,
    color: ColorName,
    rounds: number,
    phases: IntervalPhase[],
    sound: SoundPreset,
    voiceEnabledPref?: boolean
  ) => {
    setIntervals((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const firstPhase = phases[0];
          return {
            ...inv,
            name,
            color,
            totalRounds: rounds,
            phases,
            soundAlert: sound,
            voiceEnabled: voiceEnabledPref !== undefined ? voiceEnabledPref : inv.voiceEnabled,
            phaseRemainingMs: inv.isRunning ? inv.phaseRemainingMs : (firstPhase ? firstPhase.durationMs : 20000),
          };
        }
        return inv;
      })
    );
  };

  const handleDeleteInterval = (id: string) => {
    setIntervals((prev) => prev.filter((inv) => inv.id !== id));
  };

  // ==========================================
  // CREATION & PRESETS
  // ==========================================
  const handleCreateStopwatch = (name: string, color: ColorName, targetGoalMs?: number) => {
    const formattedName = capitalizeWords(name) || 'Stopwatch';
    const newSw: StopwatchItem = {
      id: `sw-${Date.now()}`,
      name: formattedName,
      color,
      isRunning: false,
      startedAt: null,
      accumulatedTime: 0,
      laps: [],
      targetGoalMs,
      createdAt: Date.now(),
    };
    setStopwatches((prev) => [newSw, ...prev]);
  };

  const handleCreateTimer = (
    name: string,
    durationMs: number,
    color: ColorName,
    soundAlert: SoundPreset = globalSound,
    soundRepeat: number = globalSoundRepeat,
    overtimeEnabled: boolean = true,
    voiceEnabledPref: boolean = true
  ) => {
    const formattedName = capitalizeWords(name) || 'Timer';
    const newTimer: TimerItem = {
      id: `timer-${Date.now()}`,
      name: formattedName,
      color,
      isRunning: false,
      startedAt: null,
      duration: durationMs,
      remainingTime: durationMs,
      soundAlert,
      soundRepeat,
      overtimeEnabled,
      voiceEnabled: voiceEnabledPref,
      isCompleted: false,
      createdAt: Date.now(),
    };
    setTimers((prev) => [newTimer, ...prev]);
  };

  const handleCreateInterval = (
    name: string,
    color: ColorName,
    rounds: number,
    phases: IntervalPhase[],
    sound: SoundPreset = globalSound,
    voiceEnabledPref: boolean = true
  ) => {
    const formattedName = capitalizeWords(name) || 'HIIT Interval';
    const firstPhase = phases && phases.length > 0 ? phases[0] : undefined;
    const newInterval: IntervalTimerItem = {
      id: `interval-${Date.now()}`,
      name: formattedName,
      color,
      isRunning: false,
      startedAt: null,
      currentRound: 1,
      totalRounds: rounds || 8,
      currentPhaseIndex: 0,
      phases: phases || [],
      phaseRemainingMs: firstPhase ? firstPhase.durationMs : 20000,
      soundAlert: sound,
      voiceEnabled: voiceEnabledPref,
      isCompleted: false,
      createdAt: Date.now(),
    };
    setIntervals((prev) => [newInterval, ...prev]);
  };
  const handleSaveAsPreset = (
    title: string, 
    durationMs: number, 
    color: ColorName, 
    intervalConfig?: TimerPreset['intervalConfig'],
    clockType: 'stopwatch' | 'timer' | 'interval' = 'timer',
    targetGoalMs?: number
  ) => {
    const formattedTitle = capitalizeWords(title);
    const preset: TimerPreset = {
      id: `custom-preset-${Date.now()}`,
      title: formattedTitle || 'Custom Preset',
      category: 'Custom',
      durationMs: Math.max(1000, durationMs),
      color,
      isCustom: true,
      clockType,
      targetGoalMs,
      intervalConfig,
    };
    const updated = [preset, ...customPresets];
    setCustomPresets(updated);
    saveCustomPresets(updated);
  };

  const handleSelectPreset = (preset: TimerPreset) => {
    if (preset.intervalConfig) {
      const phasesWithIds: IntervalPhase[] = preset.intervalConfig.phases.map((p, idx) => ({
        id: p.id || `phase-${Date.now()}-${idx}`,
        name: p.name,
        durationMs: p.durationMs,
        type: p.type,
        color: p.color,
      }));
      handleCreateInterval(
        preset.title,
        preset.color,
        preset.intervalConfig.rounds || 8,
        phasesWithIds,
        globalSound
      );
    } else if (preset.clockType === 'stopwatch') {
      handleCreateStopwatch(preset.title, preset.color, preset.targetGoalMs);
    } else {
      handleCreateTimer(preset.title, preset.durationMs, preset.color, globalSound, globalSoundRepeat);
    }
  };  

  // ==========================================
  // BATCH ACTIONS
  // ==========================================
  const handleStartAll = () => {
    backgroundNotificationService.requestNotificationPermission();
    const cur = Date.now();
    setStopwatches((prev) =>
      prev.map((sw) => (sw.isRunning ? sw : { ...sw, isRunning: true, startedAt: cur }))
    );
    setTimers((prev) =>
      prev.map((t) => {
        if (t.isRunning || t.isCompleted) return t;
        const rem = getTimerRemaining(t, cur);
        if (rem > 0) {
          capacitorBridge.scheduleAlarm(
            getNumericId(t.id),
            t.name,
            "Time's up! Your countdown has finished.",
            new Date(cur + rem)
          );
        }
        return { ...t, isRunning: true, startedAt: cur };
      })
    );
    setIntervals((prev) =>
      prev.map((inv) =>
        inv.isRunning || inv.isCompleted ? inv : { ...inv, isRunning: true, startedAt: cur }
      )
    );
  };

  const handlePauseAll = () => {
    const cur = Date.now();
    timers.forEach((t) => capacitorBridge.cancelAlarm(getNumericId(t.id)));
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.isRunning && sw.startedAt) {
          return { ...sw, isRunning: false, startedAt: null, accumulatedTime: sw.accumulatedTime + (cur - sw.startedAt) };
        }
        return sw;
      })
    );
    setTimers((prev) =>
      prev.map((t) => {
        if (t.isRunning && t.startedAt) {
          return { ...t, isRunning: false, startedAt: null, remainingTime: Math.max(0, t.remainingTime - (cur - t.startedAt)) };
        }
        return t;
      })
    );
    setIntervals((prev) =>
      prev.map((inv) => {
        if (inv.isRunning && inv.startedAt) {
          const { remainingPhaseMs } = getIntervalState(inv, cur);
          return { ...inv, isRunning: false, startedAt: null, phaseRemainingMs: remainingPhaseMs };
        }
        return inv;
      })
    );
  };

  const handleResetAll = () => {
    timers.forEach((t) => capacitorBridge.cancelAlarm(getNumericId(t.id)));
    setStopwatches((prev) =>
      prev.map((sw) => ({ ...sw, isRunning: false, startedAt: null, accumulatedTime: 0, laps: [] }))
    );
    setTimers((prev) =>
      prev.map((t) => ({ ...t, isRunning: false, startedAt: null, remainingTime: t.duration, isCompleted: false }))
    );
    setIntervals((prev) =>
      prev.map((inv) => ({
        ...inv,
        isRunning: false,
        startedAt: null,
        currentRound: 1,
        currentPhaseIndex: 0,
        phaseRemainingMs: inv.phases[0]?.durationMs || 20000,
        isCompleted: false,
      }))
    );
  };

  // Filtered lists
  const filteredStopwatches = stopwatches.filter((sw) => {
    const matchesSearch = sw.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor = selectedColorFilter === 'all' || sw.color === selectedColorFilter;
    return matchesSearch && matchesColor;
  });

  const filteredTimers = timers.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor = selectedColorFilter === 'all' || t.color === selectedColorFilter;
    return matchesSearch && matchesColor;
  });

  const filteredIntervals = intervals.filter((inv) => {
    const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor = selectedColorFilter === 'all' || inv.color === selectedColorFilter;
    return matchesSearch && matchesColor;
  });

  const runningStopwatchCount = stopwatches.filter((sw) => sw.isRunning).length;
  const runningTimerCount = timers.filter((t) => t.isRunning).length;
  const runningIntervalCount = intervals.filter((inv) => inv.isRunning).length;

  const showStopwatches = activeTab === 'all' || activeTab === 'stopwatches';
  const showTimers = activeTab === 'all' || activeTab === 'timers';
  const showIntervals = activeTab === 'all' || activeTab === 'intervals';

  const isTotalEmpty =
    (showStopwatches ? filteredStopwatches.length : 0) +
      (showTimers ? filteredTimers.length : 0) +
      (showIntervals ? filteredIntervals.length : 0) ===
    0;

  // Selected Focus & Analytics Items
  const focusedStopwatch = stopwatches.find((sw) => sw.id === focusId);
  const focusedTimer = timers.find((t) => t.id === focusId);
  const focusedInterval = intervals.find((inv) => inv.id === focusId);
  const analyticsStopwatch = stopwatches.find((sw) => sw.id === analyticsStopwatchId);

  // Register MediaSession / Lock Screen action handlers
  useEffect(() => {
    backgroundNotificationService.registerActionCallbacks({
      onPlay: () => {
        if (focusId) {
          if (focusedStopwatch) handleStartStopwatch(focusId);
          else if (focusedTimer) handleStartTimer(focusId);
          else if (focusedInterval) handleStartInterval(focusId);
        } else {
          handleStartAll();
        }
      },
      onPause: () => {
        if (focusId) {
          if (focusedStopwatch) handlePauseStopwatch(focusId);
          else if (focusedTimer) handlePauseTimer(focusId);
          else if (focusedInterval) handlePauseInterval(focusId);
        } else {
          handlePauseAll();
        }
      },
      onSkip: () => {
        if (focusId && focusedInterval) {
          handleSkipIntervalPhase(focusId);
        } else if (focusId && focusedStopwatch) {
          handleAddLap(focusId);
        } else {
          const runInv = intervals.find((i) => i.isRunning);
          if (runInv) handleSkipIntervalPhase(runInv.id);
          const runSw = stopwatches.find((s) => s.isRunning);
          if (runSw) handleAddLap(runSw.id);
        }
      },
      onReset: () => {
        if (focusId) {
          if (focusedStopwatch) handleResetStopwatch(focusId);
          else if (focusedTimer) handleResetTimer(focusId);
          else if (focusedInterval) handleResetInterval(focusId);
        } else {
          handleResetAll();
        }
      },
    });
  }, [
    focusId,
    focusedStopwatch,
    focusedTimer,
    focusedInterval,
    intervals,
    stopwatches,
    handleStartStopwatch,
    handlePauseStopwatch,
    handleResetStopwatch,
    handleStartTimer,
    handlePauseTimer,
    handleResetTimer,
    handleStartInterval,
    handlePauseInterval,
    handleResetInterval,
    handleSkipIntervalPhase,
    handleAddLap,
    handleStartAll,
    handlePauseAll,
    handleResetAll,
  ]);

  // Synchronize Lock Screen & Notification Shade
  useEffect(() => {
    const anyRunning = runningStopwatchCount > 0 || runningTimerCount > 0 || runningIntervalCount > 0;

    let primarySummary: ActiveItemSummary | null = null;

    if (focusId) {
      if (focusedInterval) {
        const { remainingPhaseMs } = getIntervalState(focusedInterval, now);
        const t = formatTime(remainingPhaseMs);
        const curPhase = focusedInterval.phases[focusedInterval.currentPhaseIndex] || focusedInterval.phases[0];
        primarySummary = {
          id: focusedInterval.id,
          name: focusedInterval.name,
          type: 'interval',
          formattedTime: `${t.minutes}:${t.seconds}`,
          isRunning: focusedInterval.isRunning,
          isCompleted: focusedInterval.isCompleted,
          phaseName: curPhase?.name,
          currentRound: focusedInterval.currentRound,
          totalRounds: focusedInterval.totalRounds,
        };
      } else if (focusedTimer) {
        const rem = getTimerRemaining(focusedTimer, now);
        const t = formatTime(rem);
        primarySummary = {
          id: focusedTimer.id,
          name: focusedTimer.name,
          type: 'timer',
          formattedTime: `${t.minutes}:${t.seconds}`,
          isRunning: focusedTimer.isRunning,
          isCompleted: focusedTimer.isCompleted,
        };
      } else if (focusedStopwatch) {
        const el = getStopwatchElapsed(focusedStopwatch, now);
        const t = formatTime(el);
        primarySummary = {
          id: focusedStopwatch.id,
          name: focusedStopwatch.name,
          type: 'stopwatch',
          formattedTime: `${t.minutes}:${t.seconds}`,
          isRunning: focusedStopwatch.isRunning,
        };
      }
    }

    if (!primarySummary) {
      const runningInv = intervals.find((i) => i.isRunning);
      if (runningInv) {
        const { remainingPhaseMs } = getIntervalState(runningInv, now);
        const t = formatTime(remainingPhaseMs);
        const curPhase = runningInv.phases[runningInv.currentPhaseIndex] || runningInv.phases[0];
        primarySummary = {
          id: runningInv.id,
          name: runningInv.name,
          type: 'interval',
          formattedTime: `${t.minutes}:${t.seconds}`,
          isRunning: true,
          phaseName: curPhase?.name,
          currentRound: runningInv.currentRound,
          totalRounds: runningInv.totalRounds,
        };
      } else {
        const runningTim = timers.find((t) => t.isRunning);
        if (runningTim) {
          const rem = getTimerRemaining(runningTim, now);
          const t = formatTime(rem);
          primarySummary = {
            id: runningTim.id,
            name: runningTim.name,
            type: 'timer',
            formattedTime: `${t.minutes}:${t.seconds}`,
            isRunning: true,
          };
        } else {
          const runningSw = stopwatches.find((s) => s.isRunning);
          if (runningSw) {
            const el = getStopwatchElapsed(runningSw, now);
            const t = formatTime(el);
            primarySummary = {
              id: runningSw.id,
              name: runningSw.name,
              type: 'stopwatch',
              formattedTime: `${t.minutes}:${t.seconds}`,
              isRunning: true,
            };
          }
        }
      }
    }

    backgroundNotificationService.update(primarySummary, anyRunning);
  }, [
    now,
    focusId,
    focusedStopwatch,
    focusedTimer,
    focusedInterval,
    runningStopwatchCount,
    runningTimerCount,
    runningIntervalCount,
    stopwatches,
    timers,
    intervals,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar with WakeLock & Voice Controls */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stopwatchCount={stopwatches.length}
        runningStopwatchCount={runningStopwatchCount}
        timerCount={timers.length}
        runningTimerCount={runningTimerCount}
        intervalCount={intervals.length}
        runningIntervalCount={runningIntervalCount}
        onOpenCreate={(type = 'timer') => {
          setCreateInitialType(type);
          setIsCreateOpen(true);
        }}
        onStartAll={handleStartAll}
        onPauseAll={handlePauseAll}
        onResetAll={handleResetAll}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        wakeLockActive={wakeLockActive}
        onToggleWakeLock={() => setWakeLockPref(!wakeLockPref)}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
      />

      <NotificationPermissionBanner />

      {/* Sub Toolbar: Search, Color Filter & Quick Create Buttons */}
      <div className="relative z-30 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full pt-3 sm:pt-6 pb-2">
        <div className="relative z-30 flex flex-col gap-2.5 bg-white/70 dark:bg-slate-900/70 p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm backdrop-blur">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Field */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stopwatches, timers & HIIT intervals..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent"
              />
            </div>

            {/* Desktop Controls */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <ColorFilterDropdown
                selectedColor={selectedColorFilter}
                onSelectColor={setSelectedColorFilter}
                className="w-44"
              />

              {/* Layout Grid / Compact Toggle */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewLayout === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Grid Layout"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout('compact')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewLayout === 'compact'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Compact Layout"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setCreateInitialType('stopwatch');
                  setIsCreateOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>+ Stopwatch</span>
              </button>

              <button
                onClick={() => {
                  setCreateInitialType('timer');
                  setIsCreateOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm whitespace-nowrap cursor-pointer"
              >
                <TimerIcon className="w-3.5 h-3.5" />
                <span>+ Timer</span>
              </button>

              <button
                onClick={() => {
                  setCreateInitialType('interval');
                  setIsCreateOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm whitespace-nowrap cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>+ HIIT</span>
              </button>
            </div>
          </div>

          {/* Mobile-Only Controls */}
          <div className="sm:hidden flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <ColorFilterDropdown
                selectedColor={selectedColorFilter}
                onSelectColor={setSelectedColorFilter}
                className="flex-1 min-w-0"
              />

              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewLayout === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewLayout('compact')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewLayout === 'compact'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  setCreateInitialType('stopwatch');
                  setIsCreateOpen(true);
                }}
                className="py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="truncate">Stopwatch</span>
              </button>

              <button
                onClick={() => {
                  setCreateInitialType('timer');
                  setIsCreateOpen(true);
                }}
                className="py-2 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
              >
                <TimerIcon className="w-3 h-3 shrink-0" />
                <span className="truncate">Timer</span>
              </button>

              <button
                onClick={() => {
                  setCreateInitialType('interval');
                  setIsCreateOpen(true);
                }}
                className="py-2 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
              >
                <Flame className="w-3 h-3 shrink-0" />
                <span className="truncate">HIIT</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 w-full py-4 sm:py-6 flex-1">
        {isTotalEmpty ? (
          <EmptyState
            activeTab={activeTab}
            onOpenCreate={(type = 'timer') => {
              setCreateInitialType(type);
              setIsCreateOpen(true);
            }}
            onOpenPresets={() => setIsPresetsOpen(true)}
          />
        ) : (
          <div className="space-y-6 sm:space-y-10">
            {/* 1. STOPWATCHES SECTION */}
            {showStopwatches && filteredStopwatches.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                      Stopwatches ({filteredStopwatches.length})
                    </h2>
                  </div>
                  {activeTab === 'all' && (
                    <button
                      onClick={() => setActiveTab('stopwatches')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View All Stopwatches →
                    </button>
                  )}
                </div>

                <div
                  className={
                    viewLayout === 'compact'
                      ? 'flex flex-col gap-2'
                      : 'grid gap-2.5 sm:gap-4 lg:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
                  }
                >
                  {filteredStopwatches.map((sw) => (
                    <StopwatchCard
                      key={sw.id}
                      stopwatch={sw}
                      elapsedMs={getStopwatchElapsed(sw, now)}
                      onStart={handleStartStopwatch}
                      onPause={handlePauseStopwatch}
                      onReset={handleResetStopwatch}
                      onAddLap={handleAddLap}
                      onUpdateName={handleUpdateStopwatchName}
                      onUpdateColor={handleUpdateStopwatchColor}
                      onUpdateTargetGoal={handleUpdateTargetGoal}
                      onDelete={handleDeleteStopwatch}
                      onOpenFocus={setFocusId}
                      onOpenAnalytics={setAnalyticsStopwatchId}
                      onSaveAsPreset={handleSaveAsPreset}
                      onEditClock={(swItem) => {
                        setEditingClock(swItem);
                        setIsCreateOpen(true);
                      }}
                      isCompact={viewLayout === 'compact'}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. TIMERS SECTION */}
            {showTimers && filteredTimers.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TimerIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                      Timers ({filteredTimers.length})
                    </h2>
                  </div>
                  {activeTab === 'all' && (
                    <button
                      onClick={() => setActiveTab('timers')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View All Timers →
                    </button>
                  )}
                </div>

                <div
                  className={
                    viewLayout === 'compact'
                      ? 'flex flex-col gap-2'
                      : 'grid gap-2.5 sm:gap-4 lg:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
                  }
                >
                  {filteredTimers.map((t) => {
                    const remaining = getTimerRemaining(t, now);
                    const overtime = t.isCompleted && t.startedAt ? Math.max(0, now - t.startedAt - t.duration) : 0;
                    return (
                      <TimerCard
                        key={t.id}
                        timer={t}
                        remainingMs={remaining}
                        overtimeMs={overtime}
                        onStart={handleStartTimer}
                        onPause={handlePauseTimer}
                        onReset={handleResetTimer}
                        onAddExtraTime={handleAddExtraTime}
                        onUpdateName={handleUpdateTimerName}
                        onUpdateColor={handleUpdateTimerColor}
                        onUpdateSound={handleUpdateTimerSound}
                        onUpdateRepeat={handleUpdateTimerRepeat}
                        onToggleOvertime={handleToggleTimerOvertime}
                        onToggleVoice={handleToggleTimerVoice}
                        onSaveAsPreset={handleSaveAsPreset}
                        onEditClock={(timerItem) => {
                          setEditingClock(timerItem);
                          setIsCreateOpen(true);
                        }}
                        onDelete={handleDeleteTimer}
                        onOpenFocus={setFocusId}
                        isCompact={viewLayout === 'compact'}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. INTERVALS / HIIT SECTION */}
            {showIntervals && filteredIntervals.length > 0 && (
              <section className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                      Interval & HIIT Workouts ({filteredIntervals.length})
                    </h2>
                  </div>
                  {activeTab === 'all' && (
                    <button
                      onClick={() => setActiveTab('intervals')}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      View All HIIT →
                    </button>
                  )}
                </div>

                <div
                  className={
                    viewLayout === 'compact'
                      ? 'flex flex-col gap-2'
                      : 'grid gap-2.5 sm:gap-4 lg:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
                  }
                >
                  {filteredIntervals.map((inv) => {
                    const { remainingPhaseMs } = getIntervalState(inv, now);
                    return (
                      <IntervalCard
                        key={inv.id}
                        interval={inv}
                        remainingPhaseMs={remainingPhaseMs}
                        now={now}
                        onStart={handleStartInterval}
                        onPause={handlePauseInterval}
                        onReset={handleResetInterval}
                        onSkipPhase={handleSkipIntervalPhase}
                        onUpdateName={handleUpdateIntervalName}
                        onUpdateColor={handleUpdateIntervalColor}
                        onToggleVoice={handleToggleIntervalVoice}
                        onSaveAsPreset={handleSaveAsPreset}
                        onEditClock={(intervalItem) => {
                          setEditingClock(intervalItem);
                          setIsCreateOpen(true);
                        }}
                        onDelete={handleDeleteInterval}
                        onOpenFocus={setFocusId}
                        isCompact={viewLayout === 'compact'}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="font-medium">
          ChronoCraft Multi-Timer, Stopwatch & HIIT Suite • Modern Native Web Application
        </p>
      </footer>

      {/* Modals */}
      <CreateModal
        key={`${isCreateOpen ? 'open' : 'closed'}-${createInitialType}`}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialType={createInitialType}
        defaultSound={globalSound}
        defaultSoundRepeat={globalSoundRepeat}
        editingItem={editingClock}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingClock(null);
        }}
        onUpdateStopwatch={handleFullUpdateStopwatch}
        onUpdateTimer={handleFullUpdateTimer}
        onUpdateInterval={handleFullUpdateInterval}
        onCreateStopwatch={handleCreateStopwatch}
        onCreateTimer={handleCreateTimer}
        onCreateInterval={handleCreateInterval}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        globalSound={globalSound}
        globalSoundRepeat={globalSoundRepeat}
        onUpdateGlobalSound={(newSound, newRepeat, applyToExisting) => {
          setGlobalSound(newSound);
          saveGlobalSoundPreference(newSound);
          setGlobalSoundRepeat(newRepeat);
          saveGlobalSoundRepeatPreference(newRepeat);
          if (applyToExisting) {
            setTimers((prev) => prev.map((t) => ({ ...t, soundAlert: newSound, soundRepeat: newRepeat })));
            setIntervals((prev) => prev.map((inv) => ({ ...inv, soundAlert: newSound })));
          }
        }}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        wakeLockActive={wakeLockPref}
        onToggleWakeLock={() => setWakeLockPref(!wakeLockPref)}
      />

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        customPresets={customPresets}
        onSelectPreset={handleSelectPreset}
        onCreateCustomPreset={(newPreset) => setCustomPresets((prev) => [newPreset, ...prev])}
        onUpdateCustomPreset={(updatedPreset) => {
          const updatedList = customPresets.map((p) => (p.id === updatedPreset.id ? updatedPreset : p));
          setCustomPresets(updatedList);
          saveCustomPresets(updatedList);
        }}
        onDeleteCustomPreset={(id) => setCustomPresets((prev) => prev.filter((p) => p.id !== id))}
      />

      {/* Lap Analytics Modal */}
      {analyticsStopwatch && (
        <LapAnalyticsModal
          isOpen={Boolean(analyticsStopwatch)}
          onClose={() => setAnalyticsStopwatchId(null)}
          stopwatch={analyticsStopwatch}
        />
      )}

      {/* Fullscreen Focus Modal */}
      {focusId && (focusedStopwatch || focusedTimer || focusedInterval) && (
        <FocusModal
          isOpen={Boolean(focusId)}
          onClose={() => setFocusId(null)}
          stopwatch={focusedStopwatch}
          timer={focusedTimer}
          interval={focusedInterval}
          now={now}
          elapsedMs={focusedStopwatch ? getStopwatchElapsed(focusedStopwatch, now) : 0}
          remainingMs={focusedTimer ? getTimerRemaining(focusedTimer, now) : 0}
          remainingPhaseMs={focusedInterval ? getIntervalState(focusedInterval, now).remainingPhaseMs : 0}
          onStart={(id) => {
            if (focusedStopwatch) handleStartStopwatch(id);
            else if (focusedTimer) handleStartTimer(id);
            else if (focusedInterval) handleStartInterval(id);
          }}
          onPause={(id) => {
            if (focusedStopwatch) handlePauseStopwatch(id);
            else if (focusedTimer) handlePauseTimer(id);
            else if (focusedInterval) handlePauseInterval(id);
          }}
          onReset={(id) => {
            if (focusedStopwatch) handleResetStopwatch(id);
            else if (focusedTimer) handleResetTimer(id);
            else if (focusedInterval) handleResetInterval(id);
          }}
          onSkipPhase={handleSkipIntervalPhase}
          onAddLap={handleAddLap}
          onAddExtraTime={handleAddExtraTime}
        />
      )}
    </div>
  );
}
