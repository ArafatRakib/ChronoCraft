import React, { useState, useRef, useEffect } from 'react';
import { StopwatchItem, ColorName } from '../types';
import { getColorTheme } from '../constants/colors';
import { formatTime } from '../utils/timeFormatter';
import { capitalizeWords } from '../utils/textFormatters';
import { ColorPicker } from './ColorPicker';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  Maximize2, 
  Trash2, 
  Edit3, 
  Check, 
  Palette, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Clock, 
  MoreVertical,
  BarChart3,
  Target,
  BookmarkPlus,
  X
} from 'lucide-react';

interface StopwatchCardProps {
  stopwatch: StopwatchItem;
  elapsedMs: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onAddLap: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateColor: (id: string, color: ColorName) => void;
  onUpdateTargetGoal?: (id: string, targetGoalMs?: number) => void;
  onDelete: (id: string) => void;
  onOpenFocus: (id: string) => void;
  onOpenAnalytics?: (id: string) => void;
  onSaveAsPreset?: (name: string, durationMs: number, color: ColorName) => void;
  isCompact?: boolean;
}

export const StopwatchCard: React.FC<StopwatchCardProps> = ({
  stopwatch,
  elapsedMs,
  onStart,
  onPause,
  onReset,
  onAddLap,
  onUpdateName,
  onUpdateColor,
  onUpdateTargetGoal,
  onDelete,
  onOpenFocus,
  onOpenAnalytics,
  onSaveAsPreset,
  isCompact = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(stopwatch.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetMinInput, setTargetMinInput] = useState(
    stopwatch.targetGoalMs ? Math.floor(stopwatch.targetGoalMs / 60000) : 5
  );
  const [targetSecInput, setTargetSecInput] = useState(
    stopwatch.targetGoalMs ? Math.floor((stopwatch.targetGoalMs % 60000) / 1000) : 0
  );
  const [showLaps, setShowLaps] = useState(true);
  const [copied, setCopied] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ right: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

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

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('.no-focus-trigger')
    ) {
      return;
    }
    onOpenFocus(stopwatch.id);
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
      onOpenFocus(stopwatch.id);
      e.preventDefault();
    }
    lastTapRef.current = currentTime;
  };

  const theme = getColorTheme(stopwatch.color);
  const time = formatTime(elapsedMs);
  // Compute live current lap time
  const previousLapsTotalMs = stopwatch.laps.reduce((acc, lap) => acc + lap.lapTime, 0);
  const currentLapMs = Math.max(0, elapsedMs - previousLapsTotalMs);
  const currentLapTime = formatTime(currentLapMs);

  const handleSaveName = () => {
    const formatted = capitalizeWords(nameInput);
    if (formatted) {
      onUpdateName(stopwatch.id, formatted);
    } else {
      setNameInput(stopwatch.name);
    }
    setIsEditingName(false);
  };

  const handleSaveTargetGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMs = (targetMinInput * 60 + targetSecInput) * 1000;
    if (onUpdateTargetGoal) {
      onUpdateTargetGoal(stopwatch.id, totalMs > 0 ? totalMs : undefined);
    }
    setShowTargetModal(false);
  };

  // Target Goal Calculations
  const hasTarget = Boolean(stopwatch.targetGoalMs && stopwatch.targetGoalMs > 0);
  const targetMs = stopwatch.targetGoalMs || 0;
  const isGoalReached = hasTarget && elapsedMs >= targetMs;
  const goalProgressPercent = hasTarget ? Math.min(100, Math.round((elapsedMs / targetMs) * 100)) : 0;
  const targetFormatted = formatTime(targetMs);

  // Find fastest & slowest laps
  let fastestLapId: string | null = null;
  let slowestLapId: string | null = null;

  if (stopwatch.laps.length > 1) {
    let minTime = Infinity;
    let maxTime = -1;
    stopwatch.laps.forEach((lap) => {
      if (lap.lapTime < minTime) {
        minTime = lap.lapTime;
        fastestLapId = lap.id;
      }
      if (lap.lapTime > maxTime) {
        maxTime = lap.lapTime;
        slowestLapId = lap.id;
      }
    });
  }

  const copyLapsToClipboard = () => {
    if (stopwatch.laps.length === 0) return;
    const lines = [`Stopwatch: ${stopwatch.name}`, `Total Time: ${time.hours}:${time.minutes}:${time.seconds}.${time.centiseconds}`, `--- Laps ---`];
    
    [...stopwatch.laps].reverse().forEach((lap) => {
      const lTime = formatTime(lap.lapTime);
      const tTime = formatTime(lap.totalTime);
      lines.push(`Lap ${lap.number}: ${lTime.minutes}:${lTime.seconds}.${lTime.centiseconds} (Total: ${tTime.minutes}:${tTime.seconds}.${tTime.centiseconds})`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compact row
  if (isCompact) {
    return (
      <div 
        ref={cardRef}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
        className={`relative rounded-xl transition-all border-l-4 border-y border-r ${theme.border} bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md p-3 flex items-center justify-between gap-3 select-none ${
          stopwatch.isRunning ? `ring-2 ring-offset-1 dark:ring-offset-slate-950 ${theme.glow}` : ''
        }`}
        style={{
          borderLeftColor: isGoalReached ? '#10b981' : theme.accentHex,
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
            style={{ backgroundColor: isGoalReached ? '#10b981' : theme.accentHex }}
            title="Change Color"
          />

          <div className="min-w-0 flex-1">
            <h3 
              onClick={() => setIsEditingName(true)}
              className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {stopwatch.name}
            </h3>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${stopwatch.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
              <span>{stopwatch.isRunning ? 'Running' : elapsedMs > 0 ? 'Paused' : 'Ready'}</span>
              {hasTarget && (
                <span className={`font-semibold ${isGoalReached ? 'text-emerald-500' : 'text-indigo-500'}`}>
                  • Goal: {targetFormatted.minutes}:{targetFormatted.seconds} ({goalProgressPercent}%)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="font-mono font-bold text-base sm:text-xl text-slate-800 dark:text-slate-100 tabular-nums shrink-0">
          {parseInt(time.hours, 10) > 0 && `${time.hours}:`}
          {time.minutes}:{time.seconds}
          <span className="text-xs sm:text-sm text-slate-400 ml-0.5">.{time.centiseconds}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => (stopwatch.isRunning ? onPause(stopwatch.id) : onStart(stopwatch.id))}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            style={{ backgroundColor: theme.accentHex }}
          >
            {stopwatch.isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            <span className="hidden sm:inline">{stopwatch.isRunning ? 'Pause' : 'Start'}</span>
          </button>

          {stopwatch.isRunning && (
            <button
              onClick={() => onAddLap(stopwatch.id)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs transition-colors cursor-pointer"
              title="Add Lap"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onReset(stopwatch.id)}
            disabled={elapsedMs === 0}
            className={`p-2 rounded-lg text-xs transition-colors ${
              elapsedMs > 0
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            }`}
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
        isGoalReached ? 'border-emerald-400 bg-emerald-50/20' : `${theme.border} bg-white dark:bg-slate-900/90`
      } shadow-sm hover:shadow-md overflow-visible flex flex-col justify-between select-none ${
        stopwatch.isRunning ? `ring-2 ring-offset-2 dark:ring-offset-slate-950 ${theme.glow}` : ''
      }`}
      style={{
        borderTopColor: isGoalReached ? '#10b981' : theme.accentHex,
        boxShadow: stopwatch.isRunning ? `0 10px 30px -10px ${theme.accentHex}25` : undefined
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
            }}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform active:scale-90 hover:scale-110 cursor-pointer shrink-0"
            style={{ backgroundColor: isGoalReached ? '#10b981' : theme.accentHex }}
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
              title={`${stopwatch.name} (Click to rename • Double-click for Focus Mode)`}
            >
              {stopwatch.name}
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
                  onOpenFocus(stopwatch.id);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Focus Mode</span>
              </button>

              {onOpenAnalytics && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenAnalytics(stopwatch.id);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Lap Analytics & CSV</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowTargetModal(true);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{hasTarget ? 'Edit Target Goal' : 'Set Target Goal'}</span>
              </button>

              {onSaveAsPreset && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSaveAsPreset(
                      stopwatch.name, 
                      stopwatch.targetGoalMs && stopwatch.targetGoalMs > 0 ? stopwatch.targetGoalMs : (elapsedMs > 0 ? elapsedMs : 60000), 
                      stopwatch.color,
                      undefined,
                      'stopwatch',
                      stopwatch.targetGoalMs
                    );
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Save as Preset</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  setIsEditingName(true);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowColorPicker(true);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 flex items-center gap-2 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Color Theme</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(stopwatch.id);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete Stopwatch</span>
              </button>
            </div>
          )}

          {showColorPicker && (
            <div 
              style={menuStyle}
              className="absolute top-full mt-1.5 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-64 animate-in fade-in zoom-in-95 no-focus-trigger"
            >
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Choose Color
              </div>
              <ColorPicker
                selectedColor={stopwatch.color}
                onSelectColor={(color) => {
                  onUpdateColor(stopwatch.id, color);
                  setShowColorPicker(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Target Goal Banner if configured */}
      {hasTarget && (
        <div className="px-3 pt-2 sm:px-4 w-full">
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 shrink-0">
              <Target className="w-3 h-3 text-indigo-500" />
              <span>Target: {targetFormatted.minutes}:{targetFormatted.seconds}</span>
            </span>
            <span className={`font-bold font-mono text-[10px] sm:text-[11px] shrink-0 ${isGoalReached ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
              {isGoalReached ? '🎯 GOAL REACHED' : `${goalProgressPercent}%`}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isGoalReached ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${goalProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Digital Clock Display */}
      <div className="p-3 sm:p-5 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-baseline font-mono tracking-tight font-bold select-none my-1">
          {parseInt(time.hours, 10) > 0 && (
            <>
              <span className="text-xl xs:text-2xl sm:text-4xl lg:text-5xl text-slate-800 dark:text-slate-100">{time.hours}</span>
              <span className="text-sm xs:text-base sm:text-2xl text-slate-400 dark:text-slate-500 mx-0.5">:</span>
            </>
          )}
          <span className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl text-slate-800 dark:text-slate-100">{time.minutes}</span>
          <span className="text-base xs:text-lg sm:text-2xl text-slate-400 dark:text-slate-500 mx-0.5">:</span>
          <span className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl text-slate-800 dark:text-slate-100">{time.seconds}</span>
          <span className="text-xs xs:text-sm sm:text-xl lg:text-2xl font-semibold text-slate-400 dark:text-slate-500 ml-1">
            .{time.centiseconds}
          </span>
        </div>

                {/* Live Lap Time & Status Indicator */}
        <div className="flex flex-col items-center justify-center gap-0.5 mt-1">
          {stopwatch.laps.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] sm:text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">Lap {stopwatch.laps.length + 1}:</span>
              <span>
                {parseInt(currentLapTime.hours, 10) > 0 && `${currentLapTime.hours}:`}
                {currentLapTime.minutes}:{currentLapTime.seconds}.{currentLapTime.centiseconds}
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${stopwatch.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
            <span>{stopwatch.isRunning ? 'Running' : elapsedMs > 0 ? 'Paused' : 'Ready'}</span>
            {stopwatch.laps.length > 0 && (
              <button
                onClick={() => onOpenAnalytics && onOpenAnalytics(stopwatch.id)}
                className="ml-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>({stopwatch.laps.length} Laps)</span>
              </button>
            )}
          </div>
        </div>
        
      </div>

      {/* Control Buttons */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 space-y-1.5">
        <button
          onClick={() => (stopwatch.isRunning ? onPause(stopwatch.id) : onStart(stopwatch.id))}
          className="w-full py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 text-white shadow-sm transition-all active:scale-[0.98] hover:opacity-95 cursor-pointer"
          style={{ backgroundColor: theme.accentHex }}
        >
          {stopwatch.isRunning ? (
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

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onAddLap(stopwatch.id)}
            disabled={!stopwatch.isRunning}
            className={`py-1.5 px-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              stopwatch.isRunning
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed'
            }`}
          >
            <Flag className="w-3.5 h-3.5 shrink-0" />
            <span>Lap</span>
          </button>

          <button
            onClick={() => onReset(stopwatch.id)}
            disabled={elapsedMs === 0}
            className={`py-1.5 px-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              elapsedMs > 0
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Expandable Laps Drawer */}
      {stopwatch.laps.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <button 
              onClick={() => setShowLaps(!showLaps)} 
              className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer select-none font-semibold"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Laps ({stopwatch.laps.length})</span>
              {showLaps ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <div className="flex items-center gap-2">
              {onOpenAnalytics && (
                <button
                  onClick={() => onOpenAnalytics(stopwatch.id)}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline transition-colors cursor-pointer"
                  title="View analytics chart and CSV export"
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Chart</span>
                </button>
              )}

              {showLaps && (
                <button
                  onClick={copyLapsToClipboard}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Copy laps text"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>

          {showLaps && (
            <div className="max-h-48 overflow-y-auto px-3 sm:px-4 pb-3 pt-0.5 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-sans text-[11px] font-semibold border-b border-slate-200/50 dark:border-slate-800/50 pb-1 mb-1 px-1">
                <span className="w-16 shrink-0 text-left">Lap</span>
                <span className="flex-1 text-center">Lap Split</span>
                <span className="w-20 shrink-0 text-right">Total Split</span>
              </div>
              {[...stopwatch.laps].reverse().map((lap) => {
                const isFastest = lap.id === fastestLapId;
                const isSlowest = lap.id === slowestLapId;
                const lTime = formatTime(lap.lapTime);
                const tTime = formatTime(lap.totalTime);

                return (
                  <div 
                    key={lap.id} 
                    className={`flex items-center justify-between py-1 px-1.5 rounded-md transition-colors ${
                      isFastest 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/50 dark:border-emerald-800/40' 
                        : isSlowest 
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200/50 dark:border-rose-800/40' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-16 shrink-0 flex items-center gap-1 min-w-0">
                      <span className="font-sans font-medium text-xs whitespace-nowrap">Lap {lap.number}</span>
                      {isFastest && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-1 py-0.2 rounded shrink-0">
                          Fast
                        </span>
                      )}
                      {isSlowest && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-100 px-1 py-0.2 rounded shrink-0">
                          Slow
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-center font-mono tabular-nums text-xs whitespace-nowrap px-1">
                      {lTime.minutes}:{lTime.seconds}.{lTime.centiseconds}
                    </span>
                    <span className="w-20 shrink-0 text-right font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {tTime.minutes}:{tTime.seconds}.{tTime.centiseconds}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Target Goal Setting Dialog */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                Target Goal
              </h4>
              <button onClick={() => setShowTargetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTargetGoal} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={targetMinInput}
                    onChange={(e) => setTargetMinInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 text-center text-sm font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={targetSecInput}
                    onChange={(e) => setTargetSecInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 text-center text-sm font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {hasTarget && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTargetGoal?.(stopwatch.id, undefined);
                      setShowTargetModal(false);
                    }}
                    className="py-2 px-3 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
