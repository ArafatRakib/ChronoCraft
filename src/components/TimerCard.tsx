import React, { useState } from 'react';
import { TimerItem, ColorName, SoundPreset } from '../types';
import { COLOR_THEMES } from '../constants/colors';
import { formatTime } from '../utils/timeFormatter';
import { soundEngine } from '../utils/audio';
import { ColorPicker } from './ColorPicker';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Maximize2, 
  Trash2, 
  Edit3, 
  Check, 
  Palette, 
  Volume2, 
  BellRing,
  RefreshCw
} from 'lucide-react';

interface TimerCardProps {
  timer: TimerItem;
  remainingMs: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onAddExtraTime: (id: string, extraMs: number) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateColor: (id: string, color: ColorName) => void;
  onUpdateSound: (id: string, sound: SoundPreset) => void;
  onDelete: (id: string) => void;
  onOpenFocus: (id: string) => void;
  isCompact?: boolean;
}

const SOUND_LABELS: Record<SoundPreset, string> = {
  chime: 'High Chime',
  digital: 'Digital Beep',
  bell: 'Bell Chime',
  marimba: 'Marimba Motif',
  gentle: 'Gentle Chord',
};

export const TimerCard: React.FC<TimerCardProps> = ({
  timer,
  remainingMs,
  onStart,
  onPause,
  onReset,
  onAddExtraTime,
  onUpdateName,
  onUpdateColor,
  onUpdateSound,
  onDelete,
  onOpenFocus,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(timer.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const theme = COLOR_THEMES[timer.color] || COLOR_THEMES.blue;
  const time = formatTime(remainingMs);

  // Math for SVG progress ring
  const progressRatio = timer.duration > 0 ? Math.max(0, Math.min(1, remainingMs / timer.duration)) : 0;
  const strokeDashoffset = 283 * (1 - progressRatio); // circumference of r=45 is ~282.7

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateName(timer.id, nameInput.trim());
    } else {
      setNameInput(timer.name);
    }
    setIsEditingName(false);
  };

  const testSound = (sound: SoundPreset) => {
    soundEngine.playAlert(sound);
  };

  return (
    <div 
      className={`relative rounded-xl sm:rounded-2xl transition-all duration-300 border-t-4 border-x border-b ${
        timer.isCompleted 
          ? 'border-rose-400 dark:border-rose-600 bg-rose-50/90 dark:bg-rose-950/40 animate-pulse' 
          : `${theme.border} bg-white dark:bg-slate-900/90`
      } shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between ${
        timer.isRunning ? `ring-2 ring-offset-2 dark:ring-offset-slate-950 ${theme.glow}` : ''
      }`}
      style={{
        borderTopColor: timer.isCompleted ? '#f43f5e' : theme.accentHex,
        boxShadow: timer.isRunning ? `0 10px 30px -10px ${theme.accentHex}25` : undefined
      }}
    >
      {/* Top Header Bar */}
      <div className={`px-2.5 py-2 sm:px-4 sm:py-3 border-b ${theme.border} flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 gap-1`}>
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <span 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: theme.accentHex }} 
          />

          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1 max-w-[140px] sm:max-w-[200px]">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                className="w-full text-xs sm:text-sm font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button 
                onClick={handleSaveName}
                className="p-0.5 sm:p-1 text-emerald-600 hover:text-emerald-700 rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0 flex-1 group">
              <h3 
                onClick={() => setIsEditingName(true)}
                className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm md:text-base cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Click to rename"
              >
                {timer.name}
              </h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hidden sm:inline-block"
                title="Rename"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Sound Preset Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSoundPicker(!showSoundPicker);
                setShowColorPicker(false);
              }}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title={`Alert Sound: ${SOUND_LABELS[timer.soundAlert]}`}
            >
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            {showSoundPicker && (
              <div className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 w-52">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Alarm Sound Tone</div>
                <div className="space-y-1">
                  {(['chime', 'digital', 'bell', 'marimba', 'gentle'] as SoundPreset[]).map((snd) => (
                    <button
                      key={snd}
                      onClick={() => {
                        onUpdateSound(timer.id, snd);
                        testSound(snd);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        timer.soundAlert === snd
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span>{SOUND_LABELS[snd]}</span>
                      {timer.soundAlert === snd && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color Palette Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowSoundPicker(false);
              }}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="Change Theme Color"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 w-48">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Color Theme</div>
                <ColorPicker
                  selectedColor={timer.color}
                  onChange={(color) => {
                    onUpdateColor(timer.id, color);
                    setShowColorPicker(false);
                  }}
                  size="sm"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenFocus(timer.id)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="Focus Mode (Fullscreen)"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => onDelete(timer.id)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Timer"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Main Countdown Display with Circular Ring */}
      <div className="p-2.5 sm:p-5 text-center flex-1 flex flex-col items-center justify-center relative min-h-[140px] sm:min-h-[200px]">
        {timer.isCompleted ? (
          /* Finished State Banner */
          <div className="py-2 sm:py-4 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg animate-bounce">
              <BellRing className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h4 className="text-sm sm:text-lg font-bold text-rose-700 dark:text-rose-300">Finished!</h4>
            <p className="text-[10px] sm:text-xs text-rose-600 dark:text-rose-400 font-medium truncate max-w-[120px] sm:max-w-none">Time's up for "{timer.name}"</p>
          </div>
        ) : (
          /* Circular Progress & Clock Display */
          <div className="relative flex items-center justify-center my-1">
            <svg className="w-28 h-28 xs:w-32 xs:h-32 sm:w-48 sm:h-48 lg:w-52 lg:h-52 -rotate-90" viewBox="0 0 100 100">
              {/* Background Track Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                strokeWidth="6"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                className="fill-none transition-all duration-300 ease-linear"
                strokeWidth="6"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke={theme.accentHex}
              />
            </svg>

            {/* Inner Clock Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-baseline font-mono tracking-tight font-bold select-none">
                {parseInt(time.hours, 10) > 0 && (
                  <>
                    <span className="text-sm xs:text-base sm:text-3xl text-slate-800 dark:text-slate-100">{time.hours}</span>
                    <span className="text-xs xs:text-sm sm:text-xl text-slate-400 dark:text-slate-500 mx-0.5">:</span>
                  </>
                )}
                <span className="text-base xs:text-xl sm:text-3xl lg:text-4xl text-slate-800 dark:text-slate-100">{time.minutes}</span>
                <span className="text-xs xs:text-sm sm:text-2xl text-slate-400 dark:text-slate-500 mx-0.5">:</span>
                <span className="text-base xs:text-xl sm:text-3xl lg:text-4xl text-slate-800 dark:text-slate-100">{time.seconds}</span>
              </div>

              {/* Status subtext */}
              <div className="text-[9px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {timer.isRunning ? 'Running' : remainingMs < timer.duration ? 'Paused' : 'Ready'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Time Buttons */}
      {!timer.isCompleted && (
        <div className="px-2 py-1 sm:px-4 sm:py-1.5 flex items-center justify-center gap-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 text-[10px] sm:text-xs">
          <span className="text-[9px] sm:text-[11px] text-slate-400 mr-0.5">Add:</span>
          <button
            onClick={() => onAddExtraTime(timer.id, 60 * 1000)}
            className="px-1.5 py-0.5 rounded-md sm:rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-0.5 font-medium"
          >
            <Plus className="w-2.5 h-2.5" /> 1m
          </button>
          <button
            onClick={() => onAddExtraTime(timer.id, 5 * 60 * 1000)}
            className="px-1.5 py-0.5 rounded-md sm:rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-0.5 font-medium"
          >
            <Plus className="w-2.5 h-2.5" /> 5m
          </button>
          <button
            onClick={() => onAddExtraTime(timer.id, 10 * 60 * 1000)}
            className="px-1.5 py-0.5 rounded-md sm:rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-0.5 font-medium hidden xs:flex"
          >
            <Plus className="w-2.5 h-2.5" /> 10m
          </button>
        </div>
      )}

      {/* Control Buttons */}
      <div className="px-2.5 pb-2.5 pt-1.5 sm:px-4 sm:pb-4 sm:pt-2">
        {timer.isCompleted ? (
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            <button
              onClick={() => onReset(timer.id)}
              className="py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 shadow transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Dismiss</span>
            </button>
            <button
              onClick={() => {
                onReset(timer.id);
                setTimeout(() => onStart(timer.id), 50);
              }}
              className="py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 text-white shadow transition-all active:scale-95"
              style={{ backgroundColor: theme.accentHex }}
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Repeat</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            {/* Play / Pause Primary Button */}
            <button
              onClick={() => (timer.isRunning ? onPause(timer.id) : onStart(timer.id))}
              className="py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 text-white shadow-sm transition-all active:scale-95 hover:opacity-95"
              style={{ backgroundColor: theme.accentHex }}
            >
              {timer.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                  <span className="truncate">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />
                  <span className="truncate">Start</span>
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={() => onReset(timer.id)}
              className="py-1.5 sm:py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate">Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
