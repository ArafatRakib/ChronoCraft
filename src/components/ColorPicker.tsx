import React, { useState, useRef, useEffect } from 'react';
import { COLOR_KEYS, COLOR_THEMES, getColorTheme } from '../constants/colors';
import { ColorName } from '../types';
import { Check, Pipette, Hash } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: ColorName;
  onChange: (color: ColorName) => void;
  onSelectColor?: (color: ColorName) => void;
  size?: 'sm' | 'md';
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onChange,
  onSelectColor,
  size = 'md',
}) => {
  const dotSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const colorInputRef = useRef<HTMLInputElement>(null);
  const handleSelect = onSelectColor || onChange || (() => {});
  
  const isPreset = COLOR_KEYS.includes(selectedColor as any);
  const currentTheme = getColorTheme(selectedColor);
  const [customHex, setCustomHex] = useState(isPreset ? '#8b5cf6' : selectedColor);

  useEffect(() => {
    if (!isPreset) {
      setCustomHex(selectedColor);
    }
  }, [selectedColor, isPreset]);

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    onChange(hex);
  };

  return (
    <div className="space-y-2.5">
      {/* Preset Swatches + Custom Swatch Row */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
        {COLOR_KEYS.map((key) => {
          const theme = COLOR_THEMES[key];
          const isSelected = selectedColor === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              title={theme.label}
              className={`${dotSize} rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 border border-black/10 dark:border-white/10 cursor-pointer ${
                isSelected ? 'scale-110 ring-2 ring-slate-800 dark:ring-slate-100 shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: theme.accentHex }}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
            </button>
          );
        })}

        {/* Custom Color Dot with Native Picker Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            title="Pick Custom Color"
            className={`${dotSize} rounded-full transition-all duration-200 flex items-center justify-center border border-dashed border-slate-400 dark:border-slate-500 hover:border-slate-600 dark:hover:border-slate-300 cursor-pointer overflow-hidden ${
              !isPreset ? 'ring-2 ring-indigo-500 scale-110 shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: !isPreset ? currentTheme.accentHex : 'transparent' }}
          >
            {!isPreset ? (
              <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
            ) : (
              <Pipette className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            )}
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={!isPreset && selectedColor.startsWith('#') ? selectedColor : '#8b5cf6'}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none cursor-pointer"
          />
        </div>
      </div>

      {/* Hex Input & Palette Launcher */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 transition-colors"
          title="Open Color Wheel"
        >
          <span 
            className="w-3 h-3 rounded-full border border-black/10 shadow-xs shrink-0" 
            style={{ backgroundColor: currentTheme.accentHex }}
          />
          <span className="whitespace-nowrap">Pick...</span>
        </button>

        <div className="relative flex-1 min-w-0 flex items-center">
          <Hash className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={!isPreset ? selectedColor.replace('#', '') : customHex.replace('#', '')}
            onChange={(e) => {
              const val = e.target.value.trim();
              const hexVal = `#${val}`;
              setCustomHex(hexVal);
              if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hexVal)) {
                onChange(hexVal);
              }
            }}
            placeholder="HEX"
            maxLength={6}
            className="w-full pl-5 pr-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase tracking-wider"
          />
        </div>
      </div>
    </div>
  );
};

