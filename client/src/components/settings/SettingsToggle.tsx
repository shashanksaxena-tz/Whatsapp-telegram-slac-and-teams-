import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface SettingsToggleProps {
  /** Label for the toggle */
  label: string;
  /** Optional description text */
  description?: string;
  /** Current value of the toggle */
  value: boolean;
  /** Callback when value changes */
  onChange: (value: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

export function SettingsToggle({
  label,
  description,
  value,
  onChange,
  disabled = false,
  className,
}: SettingsToggleProps) {
  const id = useId();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onChange(!value);
      }
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg p-3 transition-colors',
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

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!value)}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
          value ? 'bg-primary' : 'bg-gray-600',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            value ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

export default SettingsToggle;
