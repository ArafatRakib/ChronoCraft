import React from 'react';
import { ActiveTab } from '../types';
import { Clock, Timer as TimerIcon, Flame, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  activeTab: ActiveTab;
  onOpenCreate: (type?: 'stopwatch' | 'timer' | 'interval') => void;
  onOpenPresets: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  activeTab,
  onOpenCreate,
  onOpenPresets,
}) => {
  return (
    <div className="py-16 px-6 text-center max-w-md mx-auto my-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900">
        {activeTab === 'stopwatches' ? (
          <Clock className="w-8 h-8" />
        ) : activeTab === 'timers' ? (
          <TimerIcon className="w-8 h-8" />
        ) : activeTab === 'intervals' ? (
          <Flame className="w-8 h-8 text-rose-500" />
        ) : (
          <Sparkles className="w-8 h-8 text-amber-500" />
        )}
      </div>

      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        {activeTab === 'stopwatches'
          ? 'No Stopwatches Created'
          : activeTab === 'timers'
          ? 'No Timers Created'
          : activeTab === 'intervals'
          ? 'No HIIT Intervals Created'
          : 'Your Dashboard is Empty'}
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {activeTab === 'stopwatches'
          ? 'Create a customizable stopwatch with lap timing, lap split comparison, target goals, and CSV export.'
          : activeTab === 'timers'
          ? 'Create custom countdown timers with overtime tracking, voice coach, or pick from presets.'
          : activeTab === 'intervals'
          ? 'Create Tabata, boxing rounds, and multi-stage HIIT interval workouts with voice cues.'
          : 'Add stopwatches, countdown timers, or multi-stage interval workouts to track tasks, workouts, and cooking.'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {(activeTab === 'all' || activeTab === 'stopwatches') && (
          <button
            onClick={() => onOpenCreate('stopwatch')}
            className="py-2.5 px-4 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-900 dark:hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow"
          >
            <Clock className="w-4 h-4" />
            <span>+ Stopwatch</span>
          </button>
        )}

        {(activeTab === 'all' || activeTab === 'timers') && (
          <button
            onClick={() => onOpenCreate('timer')}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <TimerIcon className="w-4 h-4" />
            <span>+ Timer</span>
          </button>
        )}

        {(activeTab === 'all' || activeTab === 'intervals') && (
          <button
            onClick={() => onOpenCreate('interval')}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20"
          >
            <Flame className="w-4 h-4" />
            <span>+ HIIT</span>
          </button>
        )}

        <button
          onClick={onOpenPresets}
          className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Presets</span>
        </button>
      </div>
    </div>
  );
};
