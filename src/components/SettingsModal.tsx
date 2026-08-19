import React, { useState } from 'react';
import { SoundPreset } from '../types';
import { soundEngine } from '../utils/audio';
import { capacitorBridge } from '../utils/capacitorNativeBridge';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Play, 
  Bell, 
  Sparkles, 
  Mic, 
  Sun, 
  Smartphone, 
  Check, 
  Sliders, 
  RotateCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalSound: SoundPreset;
  globalSoundRepeat?: number;
  onUpdateGlobalSound: (sound: SoundPreset, repeat: number, applyToAllExisting?: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
}

const SOUND_OPTIONS: { id: SoundPreset; name: string; description: string; tag: string }[] = [
  { id: 'chime', name: 'Ascending Chime', description: 'Harmonic 4-note ascending chord. Pleasant & crisp.', tag: 'Default' },
  { id: 'digital', name: 'Digital Alarm', description: 'Piercing dual-square frequency wave. Hard to miss.', tag: 'Loud' },
  { id: 'bell', name: 'Classic Bell', description: 'Deep reverberating acoustic chime with long decay.', tag: 'Classic' },
  { id: 'marimba', name: 'Marimba Chords', description: 'Organic wooden melodic chord progression.', tag: 'Melodic' },
  { id: 'gentle', name: 'Gentle Harp', description: 'Soft undulating acoustic arpeggio.', tag: 'Calm' },
];

const REPEAT_OPTIONS: { value: number; label: string; desc: string }[] = [
  { value: 1, label: '1x', desc: 'Play once' },
  { value: 3, label: '3x', desc: 'Play 3 times (Default)' },
  { value: 5, label: '5x', desc: 'Play 5 times' },
  { value: 0, label: 'Loop', desc: 'Repeat until dismissed' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  globalSound,
  globalSoundRepeat = 3,
  onUpdateGlobalSound,
  isMuted,
  onToggleMute,
  voiceEnabled,
  onToggleVoice,
  wakeLockActive,
  onToggleWakeLock,
}) => {
  const [selectedSound, setSelectedSound] = useState<SoundPreset>(globalSound);
  const [selectedRepeat, setSelectedRepeat] = useState<number>(globalSoundRepeat);
  const [playingSound, setPlayingSound] = useState<SoundPreset | null>(null);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePreviewSound = (preset: SoundPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingSound(preset);
    soundEngine.playAlert(preset);
    setTimeout(() => {
      setPlayingSound((curr) => (curr === preset ? null : curr));
    }, 1200);
  };

  const handleSave = () => {
    onUpdateGlobalSound(selectedSound, selectedRepeat, applyToExisting);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const handleTestNotification = async () => {
    await capacitorBridge.requestPermissions();
    await capacitorBridge.triggerImmediateAlarm(
      'ChronoCraft Test Alarm',
      'Lock screen and high-priority sound alarm verified!'
    );
    soundEngine.playAlert(selectedSound);
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const isNative = capacitorBridge.isNative();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings & Audio</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure global sounds, notifications & speech</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Section 1: Global Default Alarm Sound */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Default Notification & Alarm Sound</span>
              </label>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                Applied to new timers & workouts
              </span>
            </div>

            <div className="space-y-2">
              {SOUND_OPTIONS.map((opt) => {
                const isSelected = selectedSound === opt.id;
                const isPlaying = playingSound === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedSound(opt.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30'
                        : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-600 dark:bg-indigo-400' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{opt.name}</span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {opt.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{opt.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePreviewSound(opt.id, e)}
                      className={`p-2 rounded-xl transition-all shrink-0 ml-2 ${
                        isPlaying
                          ? 'bg-indigo-600 text-white animate-pulse'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 border border-slate-200 dark:border-slate-700'
                      }`}
                      title="Test Audio"
                    >
                      <Play className={`w-3.5 h-3.5 ${isPlaying ? 'fill-white' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Section 1.5: Alarm Repeat Count */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Alarm Tone Repeat Count</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {REPEAT_OPTIONS.find((r) => r.value === selectedRepeat)?.desc}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {REPEAT_OPTIONS.map((opt) => {
                  const isSelected = selectedRepeat === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedRepeat(opt.value)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-600 ring-offset-1 dark:ring-offset-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{opt.label}</span>
                      <span className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {opt.value === 0 ? 'Continuous' : `${opt.value} ${opt.value === 1 ? 'time' : 'times'}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkbox to apply to all existing items */}
            <label className="flex items-center gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyToExisting}
                onChange={(e) => setApplyToExisting(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <span>Also update sound & repeat count on all existing timers</span>
            </label>
          </div>

          {/* Section 2: Global Audio & Speech Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Playback & Accessibility</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Mute toggle */}
              <div 
                onClick={onToggleMute}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  !isMuted 
                    ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20' 
                    : 'border-rose-500/50 bg-rose-50/40 dark:bg-rose-950/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${!isMuted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'}`}>
                    {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Master Sound</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{!isMuted ? 'Enabled' : 'Muted'}</span>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${!isMuted ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${!isMuted ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              {/* Voice toggle */}
              <div 
                onClick={onToggleVoice}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  voiceEnabled 
                    ? 'border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${voiceEnabled ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Voice Coach</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{voiceEnabled ? 'Announcing' : 'Off'}</span>
                  </div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${voiceEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notification & Lock Screen Diagnostics */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-emerald-500" />
              <span>Lock Screen & Alarm Verification</span>
            </label>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">System Notification & Vibration Test</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Triggers a high-priority native notification and hardware vibration to test lock screen & background wake.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    testNotificationSent
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-sm'
                  }`}
                >
                  {testNotificationSent ? 'Alarm Fired! ✓' : 'Test Alarm'}
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                <span>Device Mode: {isNative ? 'Android Native (Capacitor Bridge)' : 'Web Browser'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{savedSuccess ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
