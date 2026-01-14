// Settings Components
export { SettingsSection } from './SettingsSection';
export type { SettingsSectionProps } from './SettingsSection';

export { SettingsToggle } from './SettingsToggle';
export type { SettingsToggleProps } from './SettingsToggle';

export { SettingsSelect } from './SettingsSelect';
export type { SettingsSelectProps, SelectOption } from './SettingsSelect';

export { SettingsInput } from './SettingsInput';
export type { SettingsInputProps, InputType } from './SettingsInput';

export {
  NotificationSettings,
  createDefaultNotificationPreferences,
} from './NotificationSettings';
export type {
  NotificationSettingsProps,
  NotificationPreferences,
  NotificationCategory,
} from './NotificationSettings';

export {
  ThemeSettings,
  createDefaultThemePreferences,
  accentColors,
} from './ThemeSettings';
export type {
  ThemeSettingsProps,
  ThemePreferences,
  ThemeMode,
  AccentColor,
} from './ThemeSettings';
