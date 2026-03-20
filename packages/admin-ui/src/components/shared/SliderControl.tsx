import { useId } from 'react';

interface SliderControlProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  unit?: string;
  onChange: (value: number) => void;
}

export default function SliderControl({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  minLabel,
  maxLabel,
  unit = '',
  onChange,
}: SliderControlProps) {
  const id = useId();
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor={id} className="text-sm font-medium text-healthcare-text">
            {label}
          </label>
          {description && (
            <p className="text-xs text-healthcare-muted mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-sm font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md">
          {value}{unit}
        </span>
      </div>

      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                     accent-brand-600
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
      </div>

      <div className="flex justify-between text-xs text-healthcare-muted">
        <span>{minLabel ?? min}{unit}</span>
        <span>{maxLabel ?? max}{unit}</span>
      </div>
    </div>
  );
}
