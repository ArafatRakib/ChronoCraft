import React, { useState } from 'react';
import { StopwatchItem } from '../types';
import { getColorTheme } from '../constants/colors';
import { formatTime } from '../utils/timeFormatter';
import { 
  X, 
  BarChart3, 
  Download, 
  Copy, 
  Check, 
  Trophy, 
  TrendingDown, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';

interface LapAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stopwatch: StopwatchItem;
  elapsedMs: number;
}

export const LapAnalyticsModal: React.FC<LapAnalyticsModalProps> = ({
  isOpen,
  onClose,
  stopwatch,
  elapsedMs,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const laps = stopwatch.laps;
  const theme = getColorTheme(stopwatch.color);
  const totalTime = formatTime(elapsedMs);

  // Statistics
  let fastestLap = laps[0] || null;
  let slowestLap = laps[0] || null;
  let totalLapMs = 0;

  laps.forEach((lap) => {
    totalLapMs += lap.lapTime;
    if (!fastestLap || lap.lapTime < fastestLap.lapTime) {
      fastestLap = lap;
    }
    if (!slowestLap || lap.lapTime > slowestLap.lapTime) {
      slowestLap = lap;
    }
  });

  const avgLapMs = laps.length > 0 ? Math.round(totalLapMs / laps.length) : 0;
  const maxLapTime = slowestLap ? slowestLap.lapTime : 1;

  // Export CSV
  const handleExportCSV = () => {
    if (laps.length === 0) return;

    const headers = ['Lap Number', 'Lap Split (mm:ss.ms)', 'Lap Time (ms)', 'Total Time (mm:ss.ms)', 'Total Time (ms)', 'Date Time'];
    const rows = laps.map((lap) => {
      const lt = formatTime(lap.lapTime);
      const tt = formatTime(lap.totalTime);
      return [
        lap.number,
        `"${lt.minutes}:${lt.seconds}.${lt.centiseconds}"`,
        lap.lapTime,
        `"${tt.minutes}:${tt.seconds}.${tt.centiseconds}"`,
        lap.totalTime,
        `"${new Date(lap.timestamp).toISOString()}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${stopwatch.name.replace(/\s+/g, '_')}_Laps_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to Clipboard
  const handleCopyClipboard = () => {
    if (laps.length === 0) return;

    const lines = [
      `📊 Stopwatch: ${stopwatch.name}`,
      `Total Elapsed: ${totalTime.hours}:${totalTime.minutes}:${totalTime.seconds}.${totalTime.centiseconds}`,
      `Total Laps: ${laps.length}`,
    ];

    if (fastestLap) {
      const fl = formatTime(fastestLap.lapTime);
      lines.push(`⚡ Best Lap: Lap ${fastestLap.number} (${fl.minutes}:${fl.seconds}.${fl.centiseconds})`);
    }
    if (slowestLap) {
      const sl = formatTime(slowestLap.lapTime);
      lines.push(`🐢 Slowest Lap: Lap ${slowestLap.number} (${sl.minutes}:${sl.seconds}.${sl.centiseconds})`);
    }
    if (avgLapMs > 0) {
      const al = formatTime(avgLapMs);
      lines.push(`📈 Average Lap: ${al.minutes}:${al.seconds}.${al.centiseconds}`);
    }

    lines.push('\n--- Split Breakdown ---');
    [...laps].reverse().forEach((lap) => {
      const lt = formatTime(lap.lapTime);
      const tt = formatTime(lap.totalTime);
      lines.push(
        `#${lap.number.toString().padStart(2, '0')} | Split: ${lt.minutes}:${lt.seconds}.${lt.centiseconds} | Total: ${tt.minutes}:${tt.seconds}.${tt.centiseconds}`
      );
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lap Analytics & Export</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stopwatch.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Time */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" /> Total Time
              </span>
              <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums mt-1">
                {parseInt(totalTime.hours, 10) > 0 && `${totalTime.hours}:`}
                {totalTime.minutes}:{totalTime.seconds}
                <span className="text-xs text-slate-400">.{totalTime.centiseconds}</span>
              </span>
            </div>

            {/* Fastest Lap */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Best Lap
              </span>
              {fastestLap ? (
                <div className="mt-1">
                  <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                    {formatTime(fastestLap.lapTime).minutes}:{formatTime(fastestLap.lapTime).seconds}
                    <span className="text-xs text-emerald-600/70">.{formatTime(fastestLap.lapTime).centiseconds}</span>
                  </span>
                  <span className="text-[10px] text-emerald-600/80 block">Lap #{fastestLap.number}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 mt-1">—</span>
              )}
            </div>

            {/* Slowest Lap */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Slowest
              </span>
              {slowestLap ? (
                <div className="mt-1">
                  <span className="text-base font-bold font-mono text-rose-700 dark:text-rose-300 tabular-nums">
                    {formatTime(slowestLap.lapTime).minutes}:{formatTime(slowestLap.lapTime).seconds}
                    <span className="text-xs text-rose-600/70">.{formatTime(slowestLap.lapTime).centiseconds}</span>
                  </span>
                  <span className="text-[10px] text-rose-600/80 block">Lap #{slowestLap.number}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 mt-1">—</span>
              )}
            </div>

            {/* Average Lap */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-amber-500" /> Avg Pace
              </span>
              {avgLapMs > 0 ? (
                <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums mt-1">
                  {formatTime(avgLapMs).minutes}:{formatTime(avgLapMs).seconds}
                  <span className="text-xs text-slate-400">.{formatTime(avgLapMs).centiseconds}</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400 mt-1">—</span>
              )}
            </div>
          </div>

          {/* Visual Lap Split Distribution Chart */}
          {laps.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Visual Split Comparison
                </h3>
                <span className="text-[11px] text-slate-400">
                  {laps.length} Total Laps
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {laps.map((lap) => {
                  const percent = Math.max(12, Math.round((lap.lapTime / maxLapTime) * 100));
                  const isFastest = fastestLap && lap.id === fastestLap.id && laps.length > 1;
                  const isSlowest = slowestLap && lap.id === slowestLap.id && laps.length > 1;
                  const lt = formatTime(lap.lapTime);

                  return (
                    <div key={lap.id} className="flex items-center gap-2 text-xs">
                      <span className="w-12 shrink-0 font-medium text-slate-500 dark:text-slate-400 text-[11px]">
                        Lap {lap.number}
                      </span>
                      <div className="flex-1 bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-4 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFastest
                              ? 'bg-emerald-500'
                              : isSlowest
                              ? 'bg-rose-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {lt.minutes}:{lt.seconds}.{lt.centiseconds}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Export Action Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleExportCSV}
              disabled={laps.length === 0}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV File</span>
            </button>

            <button
              onClick={handleCopyClipboard}
              disabled={laps.length === 0}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Formatted Summary</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
