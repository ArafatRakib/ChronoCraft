import React, { useState, useMemo } from 'react';
import { TIMER_PRESETS } from '../constants/presets';
import { TimerPreset, ColorName } from '../types';
import { COLOR_THEMES, getColorTheme } from '../constants/colors';
import { ColorPicker } from './ColorPicker';
import { formatDurationHuman } from '../utils/timeFormatter';
import { capitalizeWords } from '../utils/textFormatters';
import { 
  X, 
  Sparkles, 
  Plus, 
  Clock, 
  Trash2, 
  Flame, 
  Tag,
  Check,
  PlusCircle,
  Edit3
} from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customPresets: TimerPreset[];
  onSelectPreset: (preset: TimerPreset) => void;
  onCreateCustomPreset: (preset: TimerPreset) => void;
  onUpdateCustomPreset: (preset: TimerPreset) => void;
  onDeleteCustomPreset: (id: string) => void;
}

const DEFAULT_CATEGORIES = ['Productivity', 'Fitness', 'Kitchen', 'Wellness', 'Focus & Study'];

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  customPresets,
  onSelectPreset,
  onCreateCustomPreset,
  onUpdateCustomPreset,
  onDeleteCustomPreset,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Productivity');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [newColor, setNewColor] = useState<ColorName>('indigo');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);

  // Combine built-in presets and user custom presets
  const allPresets = useMemo(() => [...customPresets, ...TIMER_PRESETS], [customPresets]);

  // Extract all distinct categories (excluding generic 'Custom' to keep list clean)
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
            allPresets.forEach((p) => {
      if (p && p.category) {
        set.add(p.category);
      }
    });
    return Array.from(set);
  }, [allPresets]);

  if (!isOpen) return null;

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    if (durationMs <= 0) {
      alert('Please enter a duration greater than 0 seconds.');
      return;
    }

    // Determine final category
    let finalCategory = selectedCategory;
    if (isAddingNewCategory) {
      finalCategory = customCategoryInput.trim() 
        ? capitalizeWords(customCategoryInput.trim()) 
        : 'Productivity';
    }

    const rawTitle = newTitle.trim() || `${minutes}m Custom Timer`;
    const finalTitle = capitalizeWords(rawTitle);

            if (editingPresetId) {
      const updatedPreset: TimerPreset = {
        id: editingPresetId,
        title: finalTitle,
        category: finalCategory,
        durationMs,
        color: newColor,
        isCustom: true,
        clockType: 'timer',
      };
      onUpdateCustomPreset(updatedPreset);
    } else {
      const preset: TimerPreset = {
        id: `custom-preset-${Date.now()}`,
        title: finalTitle,
        category: finalCategory,
        durationMs,
        color: newColor,
        isCustom: true,
        clockType: 'timer',
      };
      onCreateCustomPreset(preset);
    }

    setIsCreating(false);
    setEditingPresetId(null);
    setNewTitle('');
    setSelectedCategory(finalCategory);
    setIsAddingNewCategory(false);
    setCustomCategoryInput('');
    setHours(0);
    setMinutes(10);
    setSeconds(0);
  };

  const handleEditPresetClick = (preset: TimerPreset) => {
    setEditingPresetId(preset.id);
    setNewTitle(preset.title);
    setSelectedCategory(preset.category || 'Productivity');
    setNewColor(preset.color as ColorName);
    
    const h = Math.floor(preset.durationMs / (1000 * 60 * 60));
    const m = Math.floor((preset.durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((preset.durationMs % (1000 * 60)) / 1000);
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    
    setIsCreating(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Preset Timers Library</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pre-configured workflows & user custom presets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Preset</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Create New Custom Preset Form */}
          {isCreating && (
            <form
              onSubmit={handleSaveCustom}
              className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800/60 space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  {editingPresetId ? 'Edit Custom Preset' : 'Add Custom Preset'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPresetId(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>

              </div>

              <div className="space-y-3">
                {/* Preset Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Preset Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Espresso Extraction, Morning Sprint"
                    autoCapitalize="words"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                  />
                </div>

                {/* Sleek Category Pill Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Category
                    </label>
                    {isAddingNewCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(false);
                          setCustomCategoryInput('');
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                      >
                        Pick from existing
                      </button>
                    )}
                  </div>

                  {!isAddingNewCategory ? (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                            <span>{cat}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategory(true)}
                        className="py-1.5 px-3 rounded-xl text-xs font-medium border border-dashed border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ New Category</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        required
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Enter category name (e.g. Meditation, Study, Cooking)"
                        autoCapitalize="words"
                        className="w-full px-3 py-2 rounded-xl border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Duration Row */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Duration (Hours : Minutes : Seconds)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={hours}
                      onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="HH"
                      className="w-full py-2 text-center text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Hours</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      placeholder="MM"
                      className="w-full py-2 text-center text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Minutes</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={seconds}
                      onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      placeholder="SS"
                      className="w-full py-2 text-center text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <span className="block text-[10px] text-center text-slate-400 mt-0.5">Seconds</span>
                  </div>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Color Tag
                </label>
                <ColorPicker selectedColor={newColor} onSelectColor={setNewColor} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save to Library</span>
                </button>
              </div>
            </form>
          )}

          {/* Grouped preset categories */}
          {categories.map((cat) => {
            const presetsInCat = allPresets.filter((p) => (p.category || 'Productivity') === cat);
            if (presetsInCat.length === 0) return null;

            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    {cat === 'Fitness' ? (
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{cat}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {presetsInCat.length} {presetsInCat.length === 1 ? 'timer' : 'timers'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presetsInCat.map((preset) => {
                                        const theme = getColorTheme(preset.color || 'blue');
                    return (
                      <div
                        key={preset.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border ${theme.border} bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between group shadow-xs hover:shadow-sm`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: theme.accentHex }}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                              {preset.title}
                            </h4>
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDurationHuman(preset.durationMs)}
                                                            {preset.clockType === 'stopwatch' ? (
                                <span className="ml-1 px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-sans font-bold">
                                  Stopwatch
                                </span>
                              ) : preset.intervalConfig ? (
                                <span className="ml-1 px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-sans font-bold">
                                  Interval
                                </span>
                              ) : (
                                <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-sans font-bold">
                                  Timer
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {preset.isCustom && (                                                          <>
                              <button
                                type="button"
                                onClick={() => handleEditPresetClick(preset)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                title="Edit Custom Preset"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteCustomPreset(preset.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete Custom Preset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              onSelectPreset(preset);
                              onClose();
                            }}
                            className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
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
