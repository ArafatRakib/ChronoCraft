import React, { useState, useRef, useEffect } from 'react';
import { COLOR_KEYS, COLOR_THEMES, getColorTheme } from '../constants/colors';
import { ChevronDown, Check } from 'lucide-react';

interface ColorFilterDropdownProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  className?: string;
}

export const ColorFilterDropdown: React.FC<ColorFilterDropdownProps> = ({
  selectedColor,
  onSelectColor,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const presetOptions = COLOR_KEYS.map((key) => ({
    key,
    label: COLOR_THEMES[key].label,
    colorHex: COLOR_THEMES[key].accentHex,
  }));

  const allOptions = [
    { key: 'all', label: 'All Colors', colorHex: undefined },
    ...presetOptions,
  ];

  // If selectedColor is a custom hex not in presets, add it
  const isCustom = selectedColor !== 'all' && !COLOR_KEYS.includes(selectedColor as any);
  if (isCustom) {
    const customTheme = getColorTheme(selectedColor);
    allOptions.push({
      key: selectedColor,
      label: customTheme.label,
      colorHex: customTheme.accentHex,
    });
  }

  const selectedOption =
    allOptions.find((opt) => opt.key === selectedColor) || allOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative z-50 ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption.key === 'all' ? (
            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 shrink-0 shadow-sm" />
          ) : (
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/20"
              style={{ backgroundColor: selectedOption.colorHex }}
            />
          )}
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-52 sm:w-56 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Filter by Color
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
            {allOptions.map((option) => {
              const isSelected = option.key === selectedColor;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    onSelectColor(option.key);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {option.key === 'all' ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 shrink-0 shadow-sm" />
                    ) : (
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/20"
                        style={{ backgroundColor: option.colorHex }}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

