import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  /** Value of the option */
  value: string;
  /** Display label for the option */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface SettingsSelectProps {
  /** Label for the select */
  label: string;
  /** Optional description text */
  description?: string;
  /** Current selected value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Array of options to display */
  options: SelectOption[];
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

export function SettingsSelect({
  label,
  description,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className,
}: SettingsSelectProps) {
  const id = useId();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg p-3 transition-colors sm:flex-row sm:items-center sm:justify-between',
        disabled ? 'opacity-50' : 'hover:bg-white/5',
        className
      )}
    >
      <div className="flex-1">
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium',
            disabled ? 'text-gray-500' : 'text-white'
          )}
        >
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-gray-400">{description}</p>
        )}
      </div>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={label}
          aria-describedby={description ? `${id}-description` : undefined}
          className={cn(
            'w-full min-w-[180px] appearance-none rounded-lg border border-white/10 bg-surface px-4 py-2 pr-10 text-sm text-white transition-colors',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:border-white/20'
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-surface text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
      </div>

      {description && (
        <span id={`${id}-description`} className="sr-only">
          {description}
        </span>
      )}
    </div>
  );
}

export default SettingsSelect;
