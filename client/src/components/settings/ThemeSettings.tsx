import React from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { cn } from '../../lib/utils';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AccentColor {
  id: string;
  name: string;
  value: string;
  lightValue?: string;
}

export interface ThemePreferences {
  /** Selected theme mode */
  mode: ThemeMode;
  /** Selected accent color ID */
  accentColor: string;
}

export interface ThemeSettingsProps {
  /** Current theme preferences */
  value: ThemePreferences;
  /** Callback when preferences change */
  onChange: (value: ThemePreferences) => void;
  /** Currently resolved theme (for preview) */
  resolvedTheme?: 'light' | 'dark';
  /** Additional class names */
  className?: string;
}

const themeModes: { id: ThemeMode; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Light theme for daytime use',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Dark theme for reduced eye strain',
  },
  {
    id: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follow your system preference',
  },
];

const accentColors: AccentColor[] = [
  { id: 'purple', name: 'Purple', value: '#a855f7', lightValue: '#9333ea' },
  { id: 'blue', name: 'Blue', value: '#3b82f6', lightValue: '#2563eb' },
  { id: 'cyan', name: 'Cyan', value: '#06b6d4', lightValue: '#0891b2' },
  { id: 'green', name: 'Green', value: '#22c55e', lightValue: '#16a34a' },
  { id: 'amber', name: 'Amber', value: '#f59e0b', lightValue: '#d97706' },
  { id: 'rose', name: 'Rose', value: '#f43f5e', lightValue: '#e11d48' },
  { id: 'indigo', name: 'Indigo', value: '#6366f1', lightValue: '#4f46e5' },
  { id: 'teal', name: 'Teal', value: '#14b8a6', lightValue: '#0d9488' },
];

export function ThemeSettings({
  value,
  onChange,
  resolvedTheme = 'dark',
  className,
}: ThemeSettingsProps) {
  const handleModeChange = (mode: ThemeMode) => {
    onChange({ ...value, mode });
  };

  const handleAccentChange = (accentColor: string) => {
    onChange({ ...value, accentColor });
  };

  const selectedAccent = accentColors.find((c) => c.id === value.accentColor) || accentColors[0];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Theme Mode Selector */}
      <SettingsSection
        title="Appearance"
        description="Choose your preferred theme mode"
        icon={Moon}
      >
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Theme mode"
        >
          {themeModes.map((mode) => {
            const IconComponent = mode.icon;
            const isSelected = value.mode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleModeChange(mode.id)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 bg-surface hover:border-white/20 hover:bg-white/5'
                )}
              >
                <div
                  className={cn(
                    'rounded-lg p-3',
                    isSelected ? 'bg-primary/20' : 'bg-white/5'
                  )}
                >
                  <IconComponent
                    className={cn(
                      'h-6 w-6',
                      isSelected ? 'text-primary' : 'text-gray-400'
                    )}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-white' : 'text-gray-300'
                    )}
                  >
                    {mode.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {mode.description}
                  </p>
                </div>
                {isSelected && (
                  <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {/* Theme Preview */}
      <SettingsSection
        title="Preview"
        description="See how your theme will look"
        icon={Monitor}
      >
        <div className="overflow-hidden rounded-xl border border-white/10">
          {/* Preview Header */}
          <div
            className={cn(
              'flex items-center justify-between px-4 py-3',
              resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedAccent.value }}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                )}
              >
                Dashboard
              </span>
            </div>
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            </div>
          </div>

          {/* Preview Content */}
          <div
            className={cn(
              'flex gap-4 p-4',
              resolvedTheme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'
            )}
          >
            {/* Sidebar Preview */}
            <div
              className={cn(
                'w-16 space-y-2 rounded-lg p-2',
                resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'
              )}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-8 w-full rounded',
                    i === 1
                      ? 'opacity-100'
                      : 'opacity-40',
                    resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  )}
                  style={i === 1 ? { backgroundColor: selectedAccent.value + '40' } : undefined}
                />
              ))}
            </div>

            {/* Main Content Preview */}
            <div className="flex-1 space-y-3">
              <div
                className={cn(
                  'h-20 rounded-lg',
                  resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                )}
              />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-12 rounded-lg',
                      resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    )}
                    style={i === 1 ? { borderLeft: `3px solid ${selectedAccent.value}` } : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Accent Color Selector */}
      <SettingsSection
        title="Accent Color"
        description="Choose your accent color for highlights and buttons"
        icon={Palette}
      >
        <div
          className="flex flex-wrap gap-3"
          role="radiogroup"
          aria-label="Accent color"
        >
          {accentColors.map((color) => {
            const isSelected = value.accentColor === color.id;

            return (
              <button
                key={color.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={color.name}
                onClick={() => handleAccentChange(color.id)}
                className={cn(
                  'group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
                  isSelected
                    ? 'ring-2 ring-white'
                    : 'hover:scale-110'
                )}
                style={{
                  backgroundColor: color.value,
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  '--tw-ring-color': color.value,
                }}
              >
                {isSelected && (
                  <Check className="h-5 w-5 text-white drop-shadow-md" />
                )}
                <span className="sr-only">{color.name}</span>

                {/* Tooltip */}
                <span
                  className={cn(
                    'absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity',
                    'group-hover:opacity-100 group-focus:opacity-100'
                  )}
                >
                  {color.name}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
}

// Helper to create default theme preferences
export function createDefaultThemePreferences(): ThemePreferences {
  return {
    mode: 'dark',
    accentColor: 'purple',
  };
}

// Export accent colors for use in other components
export { accentColors };

export default ThemeSettings;
