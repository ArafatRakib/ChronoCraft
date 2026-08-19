import React, { useState, useRef, useEffect } from 'react';
import { TimerItem, ColorName, SoundPreset } from '../types';
import { getColorTheme } from '../constants/colors';
import { formatTime } from '../utils/timeFormatter';
import { capitalizeWords } from '../utils/textFormatters';
import { ColorPicker } from './ColorPicker';
import { soundEngine } from '../utils/audio';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Trash2, 
  Edit3, 
  Check, 
  Palette, 
  Plus, 
  BellRing, 
  Volume2, 
  VolumeX,
  RefreshCw, 
  MoreVertical,
  BookmarkPlus,
  Flame,
  Clock
} from 'lucide-react';

interface TimerCardProps {
  timer: TimerItem;
  remainingMs: number;
  overtimeMs?: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onAddExtraTime: (id: string, ms: number) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateColor: (id: string, color: ColorName) => void;
  onUpdateSound: (id: string, sound: SoundPreset) => void;
  onUpdateRepeat?: (id: string, repeat: number) => void;
  onToggleOvertime?: (id: string) => void;
  onToggleVoice?: (id: string) => void;
  onSaveAsPreset?: (name: string, durationMs: number, color: ColorName) => void;
  onDelete: (id: string) => void;
  onOpenFocus: (id: string) => void;
  isCompact?: boolean;
}

const SOUND_PRESETS: { id: SoundPreset; name: string }[] = [
  { id: 'chime', name: 'Gentle Chime' },
  { id: 'digital', name: 'Digital Alarm' },
  { id: 'bell', name: 'Classic Bell' },
  { id: 'marimba', name: 'Marimba Arpeggio' },
  { id: 'gentle', name: 'Soft Pulse' },
];

export const TimerCard: React.FC<TimerCardProps> = ({
  timer,
  remainingMs,
  overtimeMs = 0,
  onStart,
  onPause,
  onReset,
  onAddExtraTime,
  onUpdateName,
  onUpdateColor,
  onUpdateSound,
  onUpdateRepeat,
  onToggleOvertime,
  onToggleVoice,
  onSaveAsPreset,
  onDelete,
  onOpenFocus,
  isCompact = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(timer.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ right: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  // Smart popover position clamping (touching left edge for left watches, right edge for right watches)
  useEffect(() => {
    if ((showMenu || showColorPicker || showSoundPicker) && menuRef.current && cardRef.current) {
      const updatePosition = () => {
        if (!menuRef.current || !cardRef.current) return;
        const triggerRect = menuRef.current.getBoundingClientRect();
        const cardRect = cardRef.current.getBoundingClientRect();
        
        // Determine if this watch is on the left side or right side of the screen
        const cardCenter = cardRect.left + cardRect.width / 2;
        const isLeftHalf = cardCenter < window.innerWidth / 2;

        if (isLeftHalf) {
          // Touch / align flush with the LEFT edge of the card
          const leftOffset = cardRect.left - triggerRect.left;
          const actualLeft = triggerRect.left + leftOffset;
          const adjustedLeftOffset = actualLeft < 8 ? leftOffset + (8 - actualLeft) : leftOffset;

          setMenuStyle({
            left: `${adjustedLeftOffset}px`,
            right: 'auto',
            maxWidth: 'calc(100vw - 20px)'
          });
        } else {
          // Touch / align flush with the RIGHT edge of the card
          const rightOffset = triggerRect.right - cardRect.right;
          const actualRight = triggerRect.right - rightOffset;
          const adjustedRightOffset = actualRight > window.innerWidth - 8 
            ? rightOffset + (actualRight - (window.innerWidth - 8)) 
            : rightOffset;

          setMenuStyle({
            right: `${adjustedRightOffset}px`,
            left: 'auto',
            maxWidth: 'calc(100vw - 20px)'
          });
        }
      };

      updatePosition();
      const raf = requestAnimationFrame(updatePosition);
      return () => cancelAnimationFrame(raf);
    }
  }, [showMenu, showColorPicker, showSoundPicker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
        setShowSoundPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('.no-focus-trigger')
    ) {
      return;
    }
    onOpenFocus(timer.id);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('.no-focus-trigger')
    ) {
      return;
    }
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    if (tapLength < 300 && tapLength > 0) {
      onOpenFocus(timer.id);
      e.preventDefault();
    }
    lastTapRef.current = currentTime;
  };

  const theme = getColorTheme(timer.color);
  const isOvertime = timer.isCompleted && (timer.overtimeEnabled !== false);
  const displayMs = isOvertime ? overtimeMs : remainingMs;
  const time = formatTime(displayMs);
  const durationTime = formatTime(timer.duration);

  const handleSaveName = () => {
    const formatted = capitalizeWords(nameInput);
    if (formatted) {
      onUpdateName(timer.id, formatted);
    } else {
      setNameInput(timer.name);
    }
    setIsEditingName(false);
  };

  const handlePreviewSound = (soundId: SoundPreset) => {
    soundEngine.playAlert(soundId);
  };

  // Circular progress math (circumference = 2 * PI * 45 ≈ 283)
  const progressRatio = timer.duration > 0 ? Math.max(0, Math.min(1, remainingMs / timer.duration)) : 0;
  const strokeDashoffset = 283 * (1 - progressRatio);

  // Compact row
  if (isCompact) {
    return (
      <div 
        ref={cardRef}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        className={`relative rounded-xl transition-all border-l-4 border-y border-r ${
          timer.isCompleted
            ? 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/40'
            : `${theme.border} bg-white dark:bg-slate-900/90`
        } shadow-sm hover:shadow-md p-3 flex items-center justify-between gap-3 select-none ${
          timer.isRunning ? `ring-2 ring-offset-1 dark:ring-offset-slate-950 ${theme.glow}` : ''
        }`}
        style={{
          borderLeftColor: timer.isCompleted ? '#f43f5e' : theme.accentHex,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowMenu(false);
            }}
            className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform active:scale-90 hover:scale-110 cursor-pointer shrink-0"
            style={{ backgroundColor: timer.isCompleted ? '#f43f5e' : theme.accentHex }}
            title="Change Color"
          />

          <div className="min-w-0 flex-1">
            <h3 
              onClick={() => setIsEditingName(true)}
              className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {timer.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${timer.isCompleted ? 'bg-rose-500 animate-bounce' : timer.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
              <span className={timer.isCompleted ? 'font-bold text-rose-500' : ''}>
                {isOvertime ? `Overtime +${time.minutes}:${time.seconds}` : timer.isCompleted ? "Time's Up!" : timer.isRunning ? 'Running' : remainingMs < timer.duration ? 'Paused' : 'Ready'}
              </span>
              <span className="text-slate-400 dark:text-slate-500">• Set for {parseInt(durationTime.hours, 10) > 0 && `${durationTime.hours}:`}{durationTime.minutes}:{durationTime.seconds}</span>
            </div>
          </div>
        </div>

        <div className={`font-mono font-bold text-base sm:text-xl tabular-nums shrink-0 ${timer.isCompleted ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
          {isOvertime && '+'}
          {parseInt(time.hours, 10) > 0 && `${time.hours}:`}
          {time.minutes}:{time.seconds}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {timer.isCompleted ? (
            <button
              onClick={() => onReset(timer.id)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => (timer.isRunning ? onPause(timer.id) : onStart(timer.id))}
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                style={{ backgroundColor: theme.accentHex }}
              >
                {timer.isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span className="hidden sm:inline">{timer.isRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={() => onAddExtraTime(timer.id, 60 * 1000)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                title="Add 1m"
              >
                +1m
              </button>

              <button
                onClick={() => onReset(timer.id)}
                disabled={remainingMs === timer.duration && !timer.isRunning}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  remainingMs < timer.duration || timer.isRunning
                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                    : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                }`}
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setShowMenu(!showMenu);
                setShowColorPicker(false);
                setShowSoundPicker(false);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div 
                style={menuStyle}
                className="absolute top-full mt-1 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-48 text-xs font-medium space-y-0.5 no-focus-trigger"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenFocus(timer.id);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Focus Mode</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditingName(true);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(timer.id);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard Grid Card
  return (
    <div 
      ref={cardRef}
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleTouchEnd}
      className={`relative rounded-xl sm:rounded-2xl transition-all duration-300 border-t-4 border-x border-b ${
        timer.isCompleted 
          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 ring-2 ring-rose-500/50' 
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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowMenu(false);
              setShowSoundPicker(false);
            }}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform active:scale-90 hover:scale-110 cursor-pointer shrink-0"
            style={{ backgroundColor: timer.isCompleted ? '#f43f5e' : theme.accentHex }}
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
                className="w-full text-xs sm:text-sm font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
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

        {/* 3-dots Menu Button */}
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

          {showMenu && (
            <div 
              style={menuStyle}
              className="absolute top-full mt-1.5 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-52 max-w-[calc(100vw-24px)] animate-in fade-in zoom-in-95 space-y-0.5 text-xs font-medium no-focus-trigger"
            >
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

              {onSaveAsPreset && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSaveAsPreset(timer.name, timer.duration, timer.color);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Save as Preset</span>
                </button>
              )}

              {onToggleOvertime && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleOvertime(timer.id);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Overtime Count</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {timer.overtimeEnabled !== false ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {onToggleVoice && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleVoice(timer.id);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {timer.voiceEnabled !== false ? (
                      <Volume2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>Voice Cues</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {timer.voiceEnabled !== false ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

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
                  setShowMenu(false);
                  setShowColorPicker(true);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Color Theme</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowSoundPicker(true);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Alarm Sound</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(timer.id);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete Timer</span>
              </button>
            </div>
          )}

          {/* Color Picker Popover */}
          {showColorPicker && (
            <div 
              style={menuStyle}
              className="absolute top-full mt-1.5 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-64 max-w-[calc(100vw-24px)] animate-in fade-in zoom-in-95 no-focus-trigger"
            >
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Choose Color
              </div>
              <ColorPicker
                selectedColor={timer.color}
                onSelectColor={(color) => {
                  onUpdateColor(timer.id, color);
                  setShowColorPicker(false);
                }}
              />
            </div>
          )}

          {/* Sound Preset Picker Popover */}
          {showSoundPicker && (
            <div 
              style={menuStyle}
              className="absolute top-full mt-1.5 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-72 max-w-[calc(100vw-24px)] animate-in fade-in zoom-in-95 space-y-2 no-focus-trigger"
            >
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 px-1">
                Select Alarm Sound
              </div>
              <div className="space-y-1">
                {SOUND_PRESETS.map((preset) => {
                  const isSelected = timer.soundAlert === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors text-xs ${
                        isSelected 
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onUpdateSound(timer.id, preset.id);
                          handlePreviewSound(preset.id);
                          setShowSoundPicker(false);
                        }}
                        className="flex-1 text-left flex items-center gap-2 cursor-pointer"
                      >
                        <span>{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewSound(preset.id);
                        }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 transition-colors"
                        title="Preview Audio"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {onUpdateRepeat && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] font-medium">Alarm Repeat:</span>
                  <div className="flex items-center gap-1">
                    {[1, 3, 5].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => onUpdateRepeat(timer.id, cnt)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          (timer.soundRepeat ?? 3) === cnt
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {cnt}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Countdown Display with Circular Ring */}
      <div className="p-3 sm:p-5 text-center flex-1 flex flex-col items-center justify-center relative min-h-[130px] sm:min-h-[180px]">
        {timer.isCompleted ? (
          /* Finished State / Overtime Banner */
          <div className="py-2 sm:py-3 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg animate-bounce">
              <BellRing className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            
            {isOvertime ? (
              <div className="text-center">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider mb-1">
                  Overtime
                </span>
                <div className="font-mono font-black text-2xl sm:text-3xl text-rose-600 dark:text-rose-400 tabular-nums">
                  +{time.minutes}:{time.seconds}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Elapsed past target</p>
              </div>
            ) : (
              <>
                <h4 className="text-sm sm:text-lg font-bold text-rose-700 dark:text-rose-300">Time's Up!</h4>
                <p className="text-[10px] sm:text-xs text-rose-600 dark:text-rose-400 font-medium truncate max-w-[140px] sm:max-w-none">
                  Finished: "{timer.name}"
                </p>
              </>
            )}
          </div>
        ) : (
          /* Circular Progress & Clock Display */
          <div className="flex flex-col items-center justify-center my-0.5">
            {/* Set Duration Pill */}
            <div className="flex items-center justify-center gap-1 mb-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Set for: {parseInt(durationTime.hours, 10) > 0 && `${durationTime.hours}:`}{durationTime.minutes}:{durationTime.seconds}</span>
            </div>

            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 xs:w-32 xs:h-32 sm:w-44 sm:h-44 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                  strokeWidth="6"
                />
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

                <div className="text-[9px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                  {timer.isRunning ? 'Running' : remainingMs < timer.duration ? 'Paused' : 'Ready'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
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
