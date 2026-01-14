import React, { useId, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type InputType = 'text' | 'email' | 'password' | 'number';

export interface SettingsInputProps {
  /** Label for the input */
  label: string;
  /** Optional description text */
  description?: string;
  /** Current value of the input */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Input type */
  type?: InputType;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Validation error message */
  error?: string;
  /** Pattern for validation */
  pattern?: string;
  /** Minimum value (for number type) */
  min?: number;
  /** Maximum value (for number type) */
  max?: number;
  /** Step value (for number type) */
  step?: number;
  /** Additional class names */
  className?: string;
}

export function SettingsInput({
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  error,
  pattern,
  min,
  max,
  step,
  className,
}: SettingsInputProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg p-3 transition-colors sm:flex-row sm:items-start sm:justify-between',
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
          {required && (
            <span className="ml-1 text-red-400" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-gray-400">{description}</p>
        )}
      </div>

      <div className="flex flex-col items-end">
        <div className="relative w-full sm:w-auto">
          <input
            id={id}
            type={inputType}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            pattern={pattern}
            min={min}
            max={max}
            step={step}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={
              [description ? `${id}-description` : '', error ? `${id}-error` : '']
                .filter(Boolean)
                .join(' ') || undefined
            }
            className={cn(
              'w-full min-w-[180px] rounded-lg border bg-surface px-4 py-2 text-sm text-white transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-white/10 focus:border-primary hover:border-white/20',
              disabled && 'cursor-not-allowed',
              type === 'password' && 'pr-10'
            )}
          />
          {type === 'password' && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={disabled}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {error && (
          <div
            id={`${id}-error`}
            className="mt-1 flex items-center gap-1 text-xs text-red-400"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {description && !error && (
        <span id={`${id}-description`} className="sr-only">
          {description}
        </span>
      )}
    </div>
  );
}

export default SettingsInput;
