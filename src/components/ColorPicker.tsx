import React from 'react';
import { COLOR_KEYS, COLOR_THEMES } from '../constants/colors';
import { ColorName } from '../types';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: ColorName;
  onChange: (color: ColorName) => void;
  size?: 'sm' | 'md';
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onChange,
  size = 'md',
}) => {
  const dotSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {COLOR_KEYS.map((key) => {
        const theme = COLOR_THEMES[key];
        const isSelected = selectedColor === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={theme.label}
            className={`${dotSize} rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 border border-black/10 dark:border-white/10 ${
              isSelected ? 'scale-110 ring-2 ring-slate-800 dark:ring-slate-100 shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: theme.accentHex }}
          >
            {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
          </button>
        );
      })}
    </div>
  );
};
