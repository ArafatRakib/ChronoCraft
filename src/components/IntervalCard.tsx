import React, { useState, useRef, useEffect } from 'react';
import { IntervalTimerItem, ColorName } from '../types';
import { getColorTheme } from '../constants/colors';
import { formatTime } from '../utils/timeFormatter';
import { capitalizeWords } from '../utils/textFormatters';
import { ColorPicker } from './ColorPicker';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Trash2, 
  Edit3, 
  Check, 
  Palette, 
  Volume2, 
  VolumeX, 
  Flame, 
  Dumbbell, 
  MoreVertical,
  BookmarkPlus,
  Maximize2
} from 'lucide-react';

interface IntervalCardProps {
  interval: IntervalTimerItem;
  remainingPhaseMs?: number;
  now?: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onSkipPhase: (id: string) => void;
  onUpdateName?: (id: string, name: string) => void;
  onUpdateColor?: (id: string, color: ColorName) => void;
  onToggleVoice?: (id: string) => void;
  onSaveAsPreset?: (
    name: string, 
    durationMs: number, 
    color: ColorName, 
    intervalConfig?: TimerPreset['intervalConfig']
  ) => void;
  onEditClock?: (interval: IntervalTimerItem) => void;
  onOpenHistory?: (clockId: string, clockName: string) => void;
  onDelete: (id: string) => void;
  onOpenFocus?: (id: string) => void;
  isCompact?: boolean;
}

export const IntervalCard: React.FC<IntervalCardProps> = ({
  interval,
  remainingPhaseMs,
  now,
  onStart,
  onPause,
  onReset,
  onSkipPhase,
  onUpdateName,
  onUpdateColor,
  onToggleVoice,
  onSaveAsPreset,
  onEditClock,
  onOpenHistory,
  onDelete,
  onOpenFocus,
  isCompact = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(interval.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ right: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const currentPhase = (interval.phases && interval.phases.length > 0)
    ? (interval.phases[interval.currentPhaseIndex] || interval.phases[0])
    : { id: 'default', name: 'Work', durationMs: 30000, type: 'work' as const, color: 'rose' };

  const currentRoundSafe = !interval.currentRound || isNaN(interval.currentRound) ? 1 : interval.currentRound;
  const totalRoundsSafe = !interval.totalRounds || isNaN(interval.totalRounds) ? 8 : interval.totalRounds;

  const currentPhaseDuration = currentPhase && typeof currentPhase.durationMs === 'number' && !isNaN(currentPhase.durationMs)
    ? currentPhase.durationMs
    : 30000;

  // Safe remaining phase time computation
  const currentRemaining = typeof remainingPhaseMs === 'number' && !isNaN(remainingPhaseMs)
    ? remainingPhaseMs
    : interval.isRunning && interval.startedAt
      ? Math.max(0, (typeof interval.phaseRemainingMs === 'number' && !isNaN(interval.phaseRemainingMs) ? interval.phaseRemainingMs : currentPhaseDuration) - ((now || Date.now()) - interval.startedAt))
      : (typeof interval.phaseRemainingMs === 'number' && !isNaN(interval.phaseRemainingMs) ? interval.phaseRemainingMs : currentPhaseDuration);

  const safeRemainingMs = isNaN(currentRemaining) || currentRemaining < 0 ? 0 : currentRemaining;
  const time = formatTime(safeRemainingMs);

    // Entire card theme drives off the active phase's color
  const phaseTheme = getColorTheme(currentPhase?.color || 'rose');
  const mainTheme = phaseTheme;
  
  const progressRatio = currentPhaseDuration > 0 ? Math.max(0, Math.min(1, safeRemainingMs / currentPhaseDuration)) : 0;
  const strokeDashoffset = 283 * (1 - progressRatio);

  const nextPhaseIndex = interval.phases && interval.phases.length > 0
    ? (interval.currentPhaseIndex + 1) % interval.phases.length
    : 0;
  const nextPhase = interval.phases && interval.phases.length > 1 ? interval.phases[nextPhaseIndex] : null;

  // Double click and double tap handlers to open Focus Mode
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('.no-focus-trigger')
    ) {
      return;
    }
    if (onOpenFocus) {
      onOpenFocus(interval.id);
    }
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
    const currentTime = Date.now();
    const tapLength = currentTime - lastTapRef.current;
    if (tapLength < 450 && tapLength > 40) {
      if (onOpenFocus) {
        onOpenFocus(interval.id);
        e.preventDefault();
      }
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = currentTime;
  };

  // Smart popover position clamping (touching left edge for left watches, right edge for right watches)
  useEffect(() => {
    if ((showMenu || showColorPicker) && menuRef.current && cardRef.current) {
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
  }, [showMenu, showColorPicker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveName = () => {
    const formatted = capitalizeWords(nameInput);
    if (formatted && onUpdateName) {
      onUpdateName(interval.id, formatted);
    } else {
      setNameInput(interval.name);
    }
    setIsEditingName(false);
  };

  // Compact row
  if (isCompact) {
    return (
      <div
        ref={cardRef}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        className={`relative rounded-xl transition-all border-l-4 border-y border-r ${
          interval.isCompleted
            ? 'border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/40'
            : `${mainTheme.border} bg-white dark:bg-slate-900/90`
        } shadow-sm hover:shadow-md p-3 flex items-center justify-between gap-3 select-none cursor-pointer ${
          interval.isRunning ? `ring-2 ring-offset-1 dark:ring-offset-slate-950 ${phaseTheme.glow}` : ''
        }`}
        style={{
          borderLeftColor: interval.isCompleted ? '#10b981' : phaseTheme.accentHex,
        }}
        title="Double-click or double-tap to enter Focus Mode"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: phaseTheme.accentHex }}
          />

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm">
              {interval.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                R{currentRoundSafe}/{totalRoundsSafe} • {currentPhase?.name || 'Phase'}
              </span>
              <span>•</span>
              <span>{interval.isCompleted ? 'Finished!' : interval.isRunning ? 'Active' : 'Paused'}</span>
            </div>
          </div>
        </div>

        <div className="font-mono font-bold text-base sm:text-xl text-slate-800 dark:text-slate-100 tabular-nums shrink-0">
          {time.minutes}:{time.seconds}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenFocus && (
            <button
              onClick={() => onOpenFocus(interval.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Focus Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => (interval.isRunning ? onPause(interval.id) : onStart(interval.id))}
            className="p-2 rounded-lg text-white font-semibold transition-all active:scale-95 shadow-xs"
            style={{ backgroundColor: phaseTheme.accentHex }}
          >
            {interval.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => onSkipPhase(interval.id)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Skip Phase"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => onReset(interval.id)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
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
        interval.isCompleted
          ? 'border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/40'
          : `${mainTheme.border} bg-white dark:bg-slate-900/90`
      } shadow-sm hover:shadow-md overflow-visible flex flex-col justify-between select-none cursor-pointer ${
        interval.isRunning ? `ring-2 ring-offset-2 dark:ring-offset-slate-950 ${phaseTheme.glow}` : ''
      }`}
      style={{
        borderTopColor: interval.isCompleted ? '#10b981' : phaseTheme.accentHex,
        boxShadow: interval.isRunning ? `0 10px 30px -10px ${phaseTheme.accentHex}30` : undefined,
      }}
      title="Double-click or double-tap to enter Focus Mode"
    >
      {/* Top Header */}
      <div className={`px-3 py-2 sm:px-4 sm:py-2.5 border-b ${mainTheme.border} rounded-t-lg sm:rounded-t-xl flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 gap-2`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="p-1 rounded-md text-white flex items-center justify-center shrink-0"
            style={{ backgroundColor: phaseTheme.accentHex }}
          >
            {currentPhase?.type === 'work' ? (
              <Flame className="w-3.5 h-3.5" />
            ) : (
              <Dumbbell className="w-3.5 h-3.5" />
            )}
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                autoCapitalize="words"
                className="w-full text-xs sm:text-sm font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <button onClick={handleSaveName} className="p-0.5 text-emerald-600 rounded">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3
              onClick={() => setIsEditingName(true)}
              className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 flex-1 min-w-0"
              title={`${interval.name} (Click to rename)`}
            >
              {interval.name}
            </h3>
          )}
        </div>

        {/* 3-dots Menu & Quick Focus */}
        <div className="flex items-center gap-0.5 shrink-0">
          {onOpenFocus && (
            <button
              onClick={() => onOpenFocus(interval.id)}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Focus Mode (or double-click anywhere)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setShowMenu(!showMenu);
                setShowColorPicker(false);
              }}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                style={menuStyle}
                className="absolute top-full mt-1.5 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-48 sm:w-52 animate-in fade-in zoom-in-95 space-y-0.5 text-xs font-medium"
              >
                {onOpenFocus && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenFocus(interval.id);
                    }}
                    className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Focus Mode</span>
                  </button>
                )}
                {onSaveAsPreset && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      const totalIntervalMs = interval.phases.reduce((sum, p) => sum + p.durationMs, 0) * interval.totalRounds;
                      onSaveAsPreset(interval.name, totalIntervalMs, interval.color, {
                        rounds: interval.totalRounds,
                        phases: interval.phases.map((p) => ({
                          id: p.id,
                          name: p.name,
                          durationMs: p.durationMs,
                          type: p.type,
                          color: p.color,
                        })),
                      });
                    }}
                    className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Save as Preset</span>
                  </button>
                )}
                
                {onOpenHistory && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenHistory(interval.id, interval.name);
                    }}
                    className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Clock History Log</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditingName(true);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename</span>
                </button>

                {onEditClock && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEditClock(interval);
                    }}
                    className="w-full px-2.5 py-1.5 text-left rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Edit Clock</span>
                  </button>
                )}
                
                {onUpdateColor && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowColorPicker(true);
                    }}
                    className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    <span>Color Theme</span>
                  </button>
                )}

                {onToggleVoice && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onToggleVoice(interval.id);
                    }}
                    className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {interval.voiceEnabled !== false ? (
                        <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Voice Coach</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {interval.voiceEnabled !== false ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(interval.id);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Workout</span>
                </button>
              </div>
            )}

            {showColorPicker && onUpdateColor && (
              <div
                style={menuStyle}
                className="absolute top-full mt-1.5 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-60 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Select Workout Color</span>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Done
                  </button>
                </div>
                <ColorPicker
                  selectedColor={interval.color}
                  onSelectColor={(col) => {
                    onUpdateColor(interval.id, col);
                    setShowColorPicker(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body with Circular Gauge */}
      <div className="p-4 sm:p-5 flex flex-col items-center justify-center">
        {/* Phase Tag Pill */}
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 max-w-[120px] truncate"
              style={{
                backgroundColor: `${phaseTheme.accentHex}20`,
                color: phaseTheme.accentHex,
              }}
            >
              {currentPhase?.name || 'Phase'}
            </span>

        
        {/* Time ring */}
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 xs:w-32 xs:h-32 sm:w-40 sm:h-40 -rotate-90" viewBox="0 0 100 100">
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
              stroke={phaseTheme.accentHex}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            {/* Time Remaining */}
            <div className="font-mono font-black text-2xl xs:text-3xl sm:text-4xl text-slate-800 dark:text-slate-100 tabular-nums">
              {time.minutes}:{time.seconds}
            </div>

            {/* Round info */}
            <span className="text-[11px] font-bold text-slate-400 mt-0.5">
              Round {currentRoundSafe}/{totalRoundsSafe}
            </span>
          </div>
        </div>

        {/* Next phase preview badge */}
        {nextPhase && !interval.isCompleted && (
          <div className="mt-3 text-[11px] font-medium text-slate-400 dark:text-slate-400 flex items-center gap-1">
            <span>Next:</span>
            <span className="font-semibold text-slate-600 dark:text-slate-200 truncate max-w-[150px]">
              {nextPhase.name} ({Math.round(nextPhase.durationMs / 1000)}s)
            </span>
          </div>
        )}
      </div>

      {/* Action Footer Buttons */}
      <div className={`p-2.5 sm:p-3 border-t ${mainTheme.border} bg-slate-50/60 dark:bg-slate-800/40 rounded-b-lg sm:rounded-b-xl flex items-center justify-between gap-1.5`}>
        <button
          onClick={() => onReset(interval.id)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          title="Reset Interval"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSkipPhase(interval.id)}
            className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
            title="Skip Phase"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Skip</span>
          </button>

          <button
            onClick={() => (interval.isRunning ? onPause(interval.id) : onStart(interval.id))}
            className="py-2 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: phaseTheme.accentHex }}
          >
            {interval.isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                <span>{interval.isCompleted ? 'Restart' : 'Start'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
