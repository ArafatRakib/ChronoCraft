// File: src/components/HistoryModal.tsx
import React, { useState, useMemo } from 'react';
import { ClockHistoryEntry } from '../types';
import { getColorTheme } from '../constants/colors';
import { formatTime, formatDurationHuman } from '../utils/timeFormatter';
import { 
  X, 
  History, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Search, 
  Clock, 
  Timer as TimerIcon, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Filter
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ClockHistoryEntry[];
  clockIdFilter?: string | null;
  clockNameFilter?: string | null;
  onDeleteEntries: (ids: string[]) => void;
  onDeleteClockHistory: (clockId: string) => void;
  onClearAllHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  clockIdFilter = null,
  clockNameFilter = null,
  onDeleteEntries,
  onDeleteClockHistory,
  onClearAllHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'stopwatch' | 'timer' | 'interval'>('all');
  const [copied, setCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      if (clockIdFilter && entry.clockId !== clockIdFilter) return false;
      if (typeFilter !== 'all' && entry.clockType !== typeFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          entry.clockName.toLowerCase().includes(term) ||
          entry.clockType.toLowerCase().includes(term) ||
          entry.status.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [history, clockIdFilter, typeFilter, searchTerm]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map((e) => e.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} selected history ${selectedIds.size === 1 ? 'entry' : 'entries'}?`)) {
      onDeleteEntries(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleExportCSV = () => {
    const listToExport = selectedIds.size > 0 
      ? filteredHistory.filter((e) => selectedIds.has(e.id))
      : filteredHistory;

    if (listToExport.length === 0) return;

    const headers = [
      'Entry ID',
      'Clock Name',
      'Clock Type',
      'Status',
      'Start Time',
      'End Time',
      'Set Duration (ms)',
      'Elapsed Time (ms)',
      'Formatted Duration',
      'Target Goal (ms)',
      'Target Reached',
      'Laps Count',
      'Rounds Completed',
    ];

    const rows = listToExport.map((entry) => {
      const formatted = formatDurationHuman(entry.elapsedMs);
      return [
        `"${entry.id}"`,
        `"${entry.clockName.replace(/"/g, '""')}"`,
        `"${entry.clockType}"`,
        `"${entry.status}"`,
        `"${new Date(entry.startedAt).toISOString()}"`,
        `"${new Date(entry.completedAt).toISOString()}"`,
        entry.durationMs,
        entry.elapsedMs,
        `"${formatted}"`,
        entry.targetGoalMs || '',
        entry.isTargetReached !== undefined ? entry.isTargetReached : '',
        entry.laps ? entry.laps.length : '',
        entry.completedRounds ? `${entry.completedRounds}/${entry.totalRounds}` : '',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${(clockNameFilter || 'Clock_History').replace(/\s+/g, '_')}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboard = () => {
    const listToCopy = selectedIds.size > 0 
      ? filteredHistory.filter((e) => selectedIds.has(e.id))
      : filteredHistory;

    if (listToCopy.length === 0) return;

    const lines = [
      `📜 ChronoCraft History Log - ${clockNameFilter || 'All Clocks'}`,
      `Total Runs: ${listToCopy.length}`,
      `Exported: ${new Date().toLocaleString()}`,
      '----------------------------------------',
    ];

    listToCopy.forEach((entry, idx) => {
      const dateStr = new Date(entry.completedAt).toLocaleString();
      const elapsed = formatTime(entry.elapsedMs);
      lines.push(
        `#${idx + 1} | ${entry.clockName} [${entry.clockType.toUpperCase()}]`
      );
      lines.push(`     Status: ${entry.status} | Date: ${dateStr}`);
      lines.push(
        `     Elapsed: ${parseInt(elapsed.hours, 10) > 0 ? elapsed.hours + ':' : ''}${elapsed.minutes}:${elapsed.seconds}.${elapsed.centiseconds}`
      );
      if (entry.targetGoalMs) {
        lines.push(`     Target Goal: ${formatDurationHuman(entry.targetGoalMs)} (Reached: ${entry.isTargetReached ? 'Yes' : 'No'})`);
      }
      if (entry.laps && entry.laps.length > 0) {
        lines.push(`     Laps Recorded: ${entry.laps.length}`);
      }
      if (entry.completedRounds) {
        lines.push(`     Rounds: ${entry.completedRounds}/${entry.totalRounds}`);
      }
      lines.push('');
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {clockNameFilter ? `Run History: ${clockNameFilter}` : 'Run History Log'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filteredHistory.length} recorded run {filteredHistory.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Toolbar (Search, Filter, Export, Selection Actions) */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history by name, type or status..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Filter Segment */}
            {!clockIdFilter && (
              <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-xs shrink-0">
                {(['all', 'stopwatch', 'timer', 'interval'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                      typeFilter === t
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                {selectedIds.size === filteredHistory.length && filteredHistory.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>

              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={filteredHistory.length === 0}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{selectedIds.size > 0 ? `Export Selected CSV (${selectedIds.size})` : 'Export CSV'}</span>
              </button>

              <button
                onClick={handleCopyClipboard}
                disabled={filteredHistory.length === 0}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>
                  {copied
                    ? 'Copied!'
                    : selectedIds.size > 0
                    ? `Copy Selected (${selectedIds.size})`
                    : 'Copy Summary'}
                </span>
              </button>
              {clockIdFilter ? (
                <button
                  onClick={() => {
                    if (confirm(`Delete all history for "${clockNameFilter}"?`)) {
                      onDeleteClockHistory(clockIdFilter);
                    }
                  }}
                  className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Clear history for this clock"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear ALL clock history logs?')) {
                      onClearAllHistory();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear all history logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History Entry List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
              <History className="w-12 h-12 mx-auto opacity-40" />
              <p className="text-sm font-semibold">No run history records found.</p>
              <p className="text-xs text-slate-400">
                Completed timers, stopwatch runs, and HIIT workouts will appear here automatically.
              </p>
            </div>
          ) : (
            filteredHistory.map((entry) => {
              const theme = getColorTheme(entry.color);
              const isSelected = selectedIds.has(entry.id);
              const timeFmt = formatTime(entry.elapsedMs);

              return (
                <div
                  key={entry.id}
                  onClick={() => handleToggleSelect(entry.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(entry.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 shrink-0"
                    />

                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: theme.accentHex }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                          {entry.clockName}
                        </h4>

                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                          {entry.clockType}
                        </span>

                        {entry.status === 'completed' && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{new Date(entry.completedAt).toLocaleString()}</span>
                        {entry.targetGoalMs && (
                          <span>
                            • Target: {formatDurationHuman(entry.targetGoalMs)}{' '}
                            {entry.isTargetReached ? '🎯' : ''}
                          </span>
                        )}
                        {entry.laps && entry.laps.length > 0 && (
                          <span>• {entry.laps.length} Laps</span>
                        )}
                        {entry.completedRounds && (
                          <span>• R{entry.completedRounds}/{entry.totalRounds}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 tabular-nums">
                      {parseInt(timeFmt.hours, 10) > 0 && `${timeFmt.hours}:`}
                      {timeFmt.minutes}:{timeFmt.seconds}
                      <span className="text-[10px] text-slate-400">.{timeFmt.centiseconds}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
