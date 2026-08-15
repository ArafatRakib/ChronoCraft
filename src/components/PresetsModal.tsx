import React from 'react';
import { TIMER_PRESETS } from '../constants/presets';
import { TimerPreset, ColorName } from '../types';
import { COLOR_THEMES } from '../constants/colors';
import { formatDurationHuman } from '../utils/timeFormatter';
import { X, Sparkles, Plus, Clock } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: TimerPreset) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  // Group presets by category
  const categories = Array.from(new Set(TIMER_PRESETS.map((p) => p.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Preset Timers Library</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add pre-configured timers for focus, fitness & productivity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {categories.map((cat) => {
            const presetsInCat = TIMER_PRESETS.filter((p) => p.category === cat);
            return (
              <div key={cat} className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {cat}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presetsInCat.map((preset) => {
                    const theme = COLOR_THEMES[preset.color as ColorName] || COLOR_THEMES.blue;
                    return (
                      <div
                        key={preset.id}
                        className={`p-4 rounded-2xl border ${theme.border} bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group shadow-sm hover:shadow`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: theme.accentHex }}
                          />
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                              {preset.title}
                            </h4>
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDurationHuman(preset.durationMs)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onSelectPreset(preset);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1 shadow transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
