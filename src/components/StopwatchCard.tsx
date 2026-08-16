import React, { useState } from 'react';
import { StopwatchItem, ColorName } from '../types';
import { COLOR_THEMES } from '../constants/colors';
import { formatTime } from '../utils/timeFormatter';
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
  Clock
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
  onDelete: (id: string) => void;
  onOpenFocus: (id: string) => void;
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
  onDelete,
  onOpenFocus,
  isCompact = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(stopwatch.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLaps, setShowLaps] = useState(true);
  const [copied, setCopied] = useState(false);

  const theme = COLOR_THEMES[stopwatch.color] || COLOR_THEMES.blue;
  const time = formatTime(elapsedMs);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateName(stopwatch.id, nameInput.trim());
    } else {
      setNameInput(stopwatch.name);
    }
    setIsEditingName(false);
  };

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
    
    // Sort laps in descending order for summary
    [...stopwatch.laps].reverse().forEach((lap) => {
      const lTime = formatTime(lap.lapTime);
      const tTime = formatTime(lap.totalTime);
      lines.push(`Lap ${lap.number}: ${lTime.minutes}:${lTime.seconds}.${lTime.centiseconds} (Total: ${tTime.minutes}:${tTime.seconds}.${tTime.centiseconds})`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`relative rounded-xl sm:rounded-2xl transition-all duration-300 border-t-4 border-x border-b ${theme.border} bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between ${
        stopwatch.isRunning ? `ring-2 ring-offset-2 dark:ring-offset-slate-950 ${theme.glow}` : ''
      }`}
      style={{
        borderTopColor: theme.accentHex,
        boxShadow: stopwatch.isRunning ? `0 10px 30px -10px ${theme.accentHex}25` : undefined
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
                {stopwatch.name}
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

        {/* Right Header Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              title="Change Theme Color"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 w-48">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Color Theme</div>
                <ColorPicker
                  selectedColor={stopwatch.color}
                  onChange={(color) => {
                    onUpdateColor(stopwatch.id, color);
                    setShowColorPicker(false);
                  }}
                  size="sm"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenFocus(stopwatch.id)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="Focus Mode (Fullscreen)"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => onDelete(stopwatch.id)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Stopwatch"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

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

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-1 mt-0.5 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${stopwatch.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
          <span>{stopwatch.isRunning ? 'Running' : elapsedMs > 0 ? 'Paused' : 'Ready'}</span>
          {stopwatch.laps.length > 0 && (
            <span className="ml-1 text-slate-400">({stopwatch.laps.length}L)</span>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="px-2.5 pb-3 sm:px-4 sm:pb-4 pt-1">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {/* Lap Button */}
          <button
            onClick={() => onAddLap(stopwatch.id)}
            disabled={!stopwatch.isRunning}
            className={`py-1.5 sm:py-2 px-1 sm:px-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-all active:scale-95 ${
              stopwatch.isRunning
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed'
            }`}
          >
            <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Lap</span>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={() => (stopwatch.isRunning ? onPause(stopwatch.id) : onStart(stopwatch.id))}
            className="py-1.5 sm:py-2 px-1 sm:px-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 text-white shadow-sm transition-all active:scale-95 hover:opacity-95"
            style={{ backgroundColor: theme.accentHex }}
          >
            {stopwatch.isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
                <span className="truncate">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5 shrink-0" />
                <span className="truncate">Start</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={() => onReset(stopwatch.id)}
            disabled={elapsedMs === 0}
            className={`py-1.5 sm:py-2 px-1 sm:px-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-all active:scale-95 ${
              elapsedMs > 0
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800/50 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Expandable Laps Drawer */}
      {stopwatch.laps.length > 0 && !isCompact && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-5 py-2.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <button 
              onClick={() => setShowLaps(!showLaps)} 
              className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Laps History ({stopwatch.laps.length})</span>
              {showLaps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showLaps && (
              <button
                onClick={copyLapsToClipboard}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Copy laps text"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
          </div>

          {showLaps && (
            <div className="max-h-48 overflow-y-auto px-5 pb-3 pt-1 space-y-1.5 text-xs font-mono">
              <div className="grid grid-cols-3 text-slate-400 dark:text-slate-500 font-sans text-[11px] font-semibold border-b border-slate-200/50 dark:border-slate-800/50 pb-1 mb-1">
                <span>Lap #</span>
                <span className="text-center">Lap Time</span>
                <span className="text-right">Total Split</span>
              </div>
              {[...stopwatch.laps].reverse().map((lap) => {
                const isFastest = lap.id === fastestLapId;
                const isSlowest = lap.id === slowestLapId;
                const lTime = formatTime(lap.lapTime);
                const tTime = formatTime(lap.totalTime);

                return (
                  <div 
                    key={lap.id} 
                    className={`grid grid-cols-3 py-1 px-2 rounded ${
                      isFastest 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/50 dark:border-emerald-800/40' 
                        : isSlowest 
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="font-sans font-medium flex items-center gap-1">
                      Lap {lap.number}
                      {isFastest && <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-1 rounded">Fastest</span>}
                      {isSlowest && <span className="text-[10px] bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-100 px-1 rounded">Slowest</span>}
                    </span>
                    <span className="text-center">
                      {lTime.minutes}:{lTime.seconds}.{lTime.centiseconds}
                    </span>
                    <span className="text-right text-slate-500 dark:text-slate-400">
                      {tTime.minutes}:{tTime.seconds}.{tTime.centiseconds}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
