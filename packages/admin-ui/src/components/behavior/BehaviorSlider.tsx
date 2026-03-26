import { useId } from 'react';
import { RotateCcw } from 'lucide-react';

interface SliderStop {
  value: number;
  label: string;
}

interface BehaviorSliderProps {
  label: string;
  helperText: string;
  value: number;       // 1-5
  stops: SliderStop[];
  onChange: (value: number) => void;
  onReset: () => void;
}

export default function BehaviorSlider({
  label,
  helperText,
  value,
  stops,
  onChange,
  onReset,
}: BehaviorSliderProps) {
  const id = useId();
  const percentage = ((value - 1) / 4) * 100;

  return (
    <div className="space-y-3">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-healthcare-text">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {value !== 3 && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors"
              title="Reset to 3"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
          <span className="text-sm font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md min-w-[2.5rem] text-center">
            {value}/5
          </span>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-healthcare-muted">{helperText}</p>

      {/* Range input */}
      <input
        id={id}
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-brand-600
                   [&::-webkit-slider-thumb]:shadow-md
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:border-2
                   [&::-webkit-slider-thumb]:border-white"
        style={{
          background: `linear-gradient(to right, #1d6ef1 0%, #1d6ef1 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
        }}
      />

      {/* Stop labels */}
      <div className="flex justify-between">
        {stops.map((stop) => (
          <button
            key={stop.value}
            onClick={() => onChange(stop.value)}
            className={`text-[11px] transition-colors text-center px-1 ${
              value === stop.value
                ? 'text-brand-700 font-semibold'
                : 'text-healthcare-muted hover:text-healthcare-text'
            }`}
          >
            {stop.label}
          </button>
        ))}
      </div>
    </div>
  );
}
