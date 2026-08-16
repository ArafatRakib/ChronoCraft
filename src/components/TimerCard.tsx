import React, { useState, useRef, useEffect } from 'react';
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
  RefreshCw,
  MoreVertical
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
  onUpdateRepeat?: (id: string, repeat: number) => void;
  onDelete: (id: string) => void;
  onOpenFocus: (id: string) => void;
  isCompact?: boolean;
}

const SOUND_LABELS: Record<SoundPreset, string> = {
  chime: 'Chime',
  digital: 'Digital',
  bell: 'Bell',
  marimba: 'Marimba',
  gentle: 'Gentle',
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
  onUpdateRepeat,
  onDelete,
  onOpenFocus,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(timer.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
        setShowSoundPicker(false);
      }
    };
    if (showMenu || showColorPicker || showSoundPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showColorPicker, showSoundPicker]);

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, [role="button"], .no-focus-trigger')) {
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      onOpenFocus(timer.id);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a, [role="button"], .no-focus-trigger')) {
      return;
    }
    onOpenFocus(timer.id);
  };

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
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleTouchEnd}
      className={`relative rounded-xl sm:rounded-2xl transition-all duration-300 border-t-4 border-x border-b ${
        timer.isCompleted 
          ? 'border-rose-400 dark:border-rose-600 bg-rose-50/90 dark:bg-rose-950/40 animate-pulse' 
          : `${theme.border} bg-white dark:bg-slate-900/90`
      } shadow-sm hover:shadow-md overflow-visible flex flex-col justify-between select-none ${
        timer.isRunning ? `ring-2 ring-offset-2 dark:ring-offset-slate-950 ${theme.glow}` : ''
      }`}
      style={{
        borderTopColor: timer.isCompleted ? '#f43f5e' : theme.accentHex,
        boxShadow: timer.isRunning ? `0 10px 30px -10px ${theme.accentHex}25` : undefined
      }}
    >
      {/* Top Header Bar */}
      <div className={`px-3 py-2 sm:px-4 sm:py-2.5 border-b ${theme.border} rounded-t-lg sm:rounded-t-xl flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 gap-2`}>
        {/* Left: Color dot + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowMenu(false);
              setShowSoundPicker(false);
            }}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform active:scale-90 hover:scale-110 cursor-pointer shrink-0"
            style={{ backgroundColor: theme.accentHex }}
            title="Change Color Theme"
          />

          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                className="w-full text-xs sm:text-sm font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button 
                onClick={handleSaveName}
                className="p-0.5 text-emerald-600 hover:text-emerald-700 rounded shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3 
              onClick={() => setIsEditingName(true)}
              className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm md:text-base cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-1 min-w-0"
              title={`${timer.name} (Click to rename • Double-click for Focus Mode)`}
            >
              {timer.name}
            </h3>
          )}
        </div>

        {/* Right: Single 3-dots Menu Button */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setShowMenu(!showMenu);
              setShowColorPicker(false);
              setShowSoundPicker(false);
            }}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* More Options Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1.5 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-48 sm:w-52 animate-in fade-in zoom-in-95 space-y-0.5 text-xs font-medium no-focus-trigger">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenFocus(timer.id);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Focus Mode</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setIsEditingName(true);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setShowSoundPicker(true);
                  setShowMenu(false);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="whitespace-nowrap">Alarm Sound</span>
                </div>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 shrink-0">
                  {SOUND_LABELS[timer.soundAlert]}
                </span>
              </button>

              <button
                onClick={() => {
                  setShowColorPicker(true);
                  setShowMenu(false);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Color Theme</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(timer.id);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Delete Timer</span>
              </button>
            </div>
          )}

          {/* Sound Preset Picker Submenu */}
          {showSoundPicker && (
            <div className="absolute right-0 top-full mt-1.5 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-56 sm:w-60 animate-in fade-in zoom-in-95 no-focus-trigger">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  Alarm Tone
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {(['chime', 'digital', 'bell', 'marimba', 'gentle'] as SoundPreset[]).map((snd) => (
                  <button
                    key={snd}
                    onClick={() => {
                      onUpdateSound(timer.id, snd);
                      testSound(snd);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      timer.soundAlert === snd
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{SOUND_LABELS[snd]}</span>
                    {timer.soundAlert === snd && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Repeat Alert
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Once (1x)', val: 1 },
                    { label: 'Repeat 3x', val: 3 },
                    { label: 'Repeat 5x', val: 5 },
                    { label: 'Loop (Until Stop)', val: 0 },
                  ].map((rep) => {
                    const currentRepeat = timer.soundRepeat !== undefined ? timer.soundRepeat : 3;
                    const isSelected = currentRepeat === rep.val;
                    return (
                      <button
                        key={rep.val}
                        onClick={() => {
                          if (onUpdateRepeat) {
                            onUpdateRepeat(timer.id, rep.val);
                          }
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-medium text-center transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        {rep.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Color Palette Popover */}
          {showColorPicker && (
            <div className="absolute right-0 top-full mt-1.5 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-48 animate-in fade-in zoom-in-95 no-focus-trigger">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Color Theme</div>
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
      </div>

      {/* Main Countdown Display with Circular Ring */}
      <div className="p-3 sm:p-5 text-center flex-1 flex flex-col items-center justify-center relative min-h-[130px] sm:min-h-[180px]">
        {timer.isCompleted ? (
          /* Finished State Banner */
          <div className="py-2 sm:py-3 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg animate-bounce">
              <BellRing className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h4 className="text-sm sm:text-lg font-bold text-rose-700 dark:text-rose-300">Time's Up!</h4>
            <p className="text-[10px] sm:text-xs text-rose-600 dark:text-rose-400 font-medium truncate max-w-[140px] sm:max-w-none">Finished: "{timer.name}"</p>
          </div>
        ) : (
          /* Circular Progress & Clock Display */
          <div className="relative flex items-center justify-center my-0.5">
            <svg className="w-28 h-28 xs:w-32 xs:h-32 sm:w-44 sm:h-44 -rotate-90" viewBox="0 0 100 100">
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
                    <span className="text-sm xs:text-base sm:text-2xl lg:text-3xl text-slate-800 dark:text-slate-100">{time.hours}</span>
                    <span className="text-xs xs:text-sm sm:text-lg text-slate-400 dark:text-slate-500 mx-0.5">:</span>
                  </>
                )}
                <span className="text-lg xs:text-2xl sm:text-3xl lg:text-4xl text-slate-800 dark:text-slate-100">{time.minutes}</span>
                <span className="text-sm xs:text-lg sm:text-2xl text-slate-400 dark:text-slate-500 mx-0.5">:</span>
                <span className="text-lg xs:text-2xl sm:text-3xl lg:text-4xl text-slate-800 dark:text-slate-100">{time.seconds}</span>
              </div>

              {/* Status subtext */}
              <div className="text-[9px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {timer.isRunning ? 'Running' : remainingMs < timer.duration ? 'Paused' : 'Ready'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons (2-Row Layout: Big Start/Dismiss + Secondary Actions) */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 space-y-1.5">
        {timer.isCompleted ? (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onReset(timer.id)}
              className="py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
            <button
              onClick={() => {
                onReset(timer.id);
                setTimeout(() => onStart(timer.id), 50);
              }}
              className="py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: theme.accentHex }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repeat</span>
            </button>
          </div>
        ) : (
          <>
            {/* Row 1: Primary Full-Width Start / Pause Button */}
            <button
              onClick={() => (timer.isRunning ? onPause(timer.id) : onStart(timer.id))}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 text-white shadow-sm transition-all active:scale-[0.98] hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: theme.accentHex }}
            >
              {timer.isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white shrink-0" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white ml-0.5 shrink-0" />
                  <span>Start</span>
                </>
              )}
            </button>

            {/* Row 2: Secondary Controls (Reset + Quick Time Adder) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onReset(timer.id)}
                disabled={remainingMs === timer.duration && !timer.isRunning}
                className={`py-1.5 px-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 ${
                  remainingMs < timer.duration || timer.isRunning
                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed'
                }`}
                title="Reset to default duration"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-1 flex-1 justify-end">
                <button
                  onClick={() => onAddExtraTime(timer.id, 60 * 1000)}
                  className="flex-1 py-1.5 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
                  title="Add 1 minute"
                >
                  <Plus className="w-3 h-3" />1m
                </button>
                <button
                  onClick={() => onAddExtraTime(timer.id, 5 * 60 * 1000)}
                  className="flex-1 py-1.5 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
                  title="Add 5 minutes"
                >
                  <Plus className="w-3 h-3" />5m
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
