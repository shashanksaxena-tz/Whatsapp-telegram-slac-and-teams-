import React from 'react';
import { Bell, Mail, Volume2, MessageSquare, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { SettingsToggle } from './SettingsToggle';
import { cn } from '../../lib/utils';

export interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
  sound: boolean;
}

export interface NotificationPreferences {
  /** Global email notifications toggle */
  emailEnabled: boolean;
  /** Global push notifications toggle */
  pushEnabled: boolean;
  /** Global sound notifications toggle */
  soundEnabled: boolean;
  /** Per-category notification settings */
  categories: NotificationCategory[];
}

export interface NotificationSettingsProps {
  /** Current notification preferences */
  value: NotificationPreferences;
  /** Callback when preferences change */
  onChange: (value: NotificationPreferences) => void;
  /** Additional class names */
  className?: string;
}

const defaultCategories: Omit<NotificationCategory, 'email' | 'push' | 'sound'>[] = [
  {
    id: 'escalations',
    label: 'Escalations',
    description: 'Critical issues requiring immediate attention',
    icon: AlertTriangle,
  },
  {
    id: 'new_conversations',
    label: 'New Conversations',
    description: 'Incoming messages from new customers',
    icon: MessageSquare,
  },
  {
    id: 'mentions',
    label: 'Mentions',
    description: 'When someone mentions you in a conversation',
    icon: Users,
  },
  {
    id: 'resolutions',
    label: 'Resolutions',
    description: 'When conversations are marked as resolved',
    icon: CheckCircle,
  },
];

export function NotificationSettings({
  value,
  onChange,
  className,
}: NotificationSettingsProps) {
  const handleGlobalToggle = (
    field: 'emailEnabled' | 'pushEnabled' | 'soundEnabled',
    newValue: boolean
  ) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const handleCategoryToggle = (
    categoryId: string,
    field: 'email' | 'push' | 'sound',
    newValue: boolean
  ) => {
    onChange({
      ...value,
      categories: value.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, [field]: newValue } : cat
      ),
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Global Settings */}
      <SettingsSection
        title="Notification Channels"
        description="Configure how you want to receive notifications"
        icon={Bell}
      >
        <SettingsToggle
          label="Email Notifications"
          description="Receive notifications via email"
          value={value.emailEnabled}
          onChange={(v) => handleGlobalToggle('emailEnabled', v)}
        />
        <SettingsToggle
          label="Push Notifications"
          description="Receive browser push notifications"
          value={value.pushEnabled}
          onChange={(v) => handleGlobalToggle('pushEnabled', v)}
        />
        <SettingsToggle
          label="Sound Notifications"
          description="Play sound when notifications arrive"
          value={value.soundEnabled}
          onChange={(v) => handleGlobalToggle('soundEnabled', v)}
        />
      </SettingsSection>

      {/* Per-Category Settings */}
      <SettingsSection
        title="Notification Categories"
        description="Customize notifications for each category"
        icon={Bell}
        collapsible
        defaultCollapsed={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]" role="grid">
            <thead>
              <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                <th className="pb-3 font-medium" scope="col">
                  Category
                </th>
                <th className="pb-3 text-center font-medium" scope="col">
                  <div className="flex items-center justify-center gap-1">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Email</span>
                  </div>
                </th>
                <th className="pb-3 text-center font-medium" scope="col">
                  <div className="flex items-center justify-center gap-1">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Push</span>
                  </div>
                </th>
                <th className="pb-3 text-center font-medium" scope="col">
                  <div className="flex items-center justify-center gap-1">
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Sound</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {value.categories.map((category) => {
                const IconComponent = defaultCategories.find(
                  (c) => c.id === category.id
                )?.icon;

                return (
                  <tr
                    key={category.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {IconComponent && (
                          <IconComponent
                            className="h-4 w-4 text-gray-400"
                            aria-hidden="true"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {category.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <CategoryToggle
                        checked={category.email}
                        onChange={(v) =>
                          handleCategoryToggle(category.id, 'email', v)
                        }
                        disabled={!value.emailEnabled}
                        label={`Email for ${category.label}`}
                      />
                    </td>
                    <td className="py-4 text-center">
                      <CategoryToggle
                        checked={category.push}
                        onChange={(v) =>
                          handleCategoryToggle(category.id, 'push', v)
                        }
                        disabled={!value.pushEnabled}
                        label={`Push for ${category.label}`}
                      />
                    </td>
                    <td className="py-4 text-center">
                      <CategoryToggle
                        checked={category.sound}
                        onChange={(v) =>
                          handleCategoryToggle(category.id, 'sound', v)
                        }
                        disabled={!value.soundEnabled}
                        label={`Sound for ${category.label}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SettingsSection>
    </div>
  );
}

interface CategoryToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
}

function CategoryToggle({
  checked,
  onChange,
  disabled = false,
  label,
}: CategoryToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative mx-auto inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        checked ? 'bg-primary' : 'bg-gray-600',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// Helper to create default notification preferences
export function createDefaultNotificationPreferences(): NotificationPreferences {
  return {
    emailEnabled: true,
    pushEnabled: true,
    soundEnabled: true,
    categories: defaultCategories.map((cat) => ({
      ...cat,
      email: true,
      push: true,
      sound: cat.id === 'escalations',
    })),
  };
}

export default NotificationSettings;
