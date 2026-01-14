import React, { useState, useCallback } from 'react';
import {
  Save,
  User,
  Camera,
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  Download,
  RotateCcw,
} from 'lucide-react';
import {
  SettingsSection,
  SettingsInput,
  SettingsToggle,
  NotificationSettings,
  ThemeSettings,
  createDefaultNotificationPreferences,
  createDefaultThemePreferences,
  NotificationPreferences,
  ThemePreferences,
} from '../components/settings';

// Types
interface ProfileSettings {
  name: string;
  email: string;
  avatarUrl: string;
}

interface ResponseTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface SettingsState {
  profile: ProfileSettings;
  notifications: NotificationPreferences;
  theme: ThemePreferences;
  templates: ResponseTemplate[];
}

interface ValidationErrors {
  name?: string;
  email?: string;
  templateName?: string;
  templateContent?: string;
}

// Initial mock data
const createInitialState = (): SettingsState => ({
  profile: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl: '',
  },
  notifications: createDefaultNotificationPreferences(),
  theme: createDefaultThemePreferences(),
  templates: [
    {
      id: '1',
      name: 'Welcome Message',
      content:
        'Hello! Thank you for reaching out. How can I assist you today?',
      category: 'greeting',
    },
    {
      id: '2',
      name: 'Escalation Notice',
      content:
        'I understand your concern. Let me connect you with a specialist who can better assist you.',
      category: 'escalation',
    },
    {
      id: '3',
      name: 'Resolution Confirmation',
      content:
        'Great! I am glad we could resolve this for you. Is there anything else I can help with?',
      category: 'resolution',
    },
  ],
});

// Validation helpers
const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

const validateName = (name: string): string | undefined => {
  if (!name) {
    return 'Name is required';
  }
  if (name.length < 2) {
    return 'Name must be at least 2 characters';
  }
  return undefined;
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>(createInitialState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'general',
  });
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);

  // Profile handlers
  const handleProfileChange = useCallback(
    (field: keyof ProfileSettings, value: string) => {
      setSettings((prev) => ({
        ...prev,
        profile: { ...prev.profile, [field]: value },
      }));

      // Clear error when user starts typing
      if (errors[field as keyof ValidationErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // Notification handlers
  const handleNotificationChange = useCallback(
    (value: NotificationPreferences) => {
      setSettings((prev) => ({ ...prev, notifications: value }));
    },
    []
  );

  // Theme handlers
  const handleThemeChange = useCallback((value: ThemePreferences) => {
    setSettings((prev) => ({ ...prev, theme: value }));
  }, []);

  // Template handlers
  const handleAddTemplate = useCallback(() => {
    if (!newTemplate.name.trim()) {
      setErrors((prev) => ({ ...prev, templateName: 'Template name is required' }));
      return;
    }
    if (!newTemplate.content.trim()) {
      setErrors((prev) => ({
        ...prev,
        templateContent: 'Template content is required',
      }));
      return;
    }

    const template: ResponseTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name.trim(),
      content: newTemplate.content.trim(),
      category: newTemplate.category,
    };

    setSettings((prev) => ({
      ...prev,
      templates: [...prev.templates, template],
    }));

    setNewTemplate({ name: '', content: '', category: 'general' });
    setShowNewTemplateForm(false);
    setErrors((prev) => ({
      ...prev,
      templateName: undefined,
      templateContent: undefined,
    }));
  }, [newTemplate]);

  const handleDeleteTemplate = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== id),
    }));
  }, []);

  // Danger zone handlers
  const handleResetPreferences = useCallback(() => {
    if (
      window.confirm(
        'Are you sure you want to reset all preferences to default? This action cannot be undone.'
      )
    ) {
      setSettings(createInitialState());
      setSaveSuccess(false);
    }
  }, []);

  const handleExportData = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'settings-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [settings]);

  // Save handler
  const handleSave = useCallback(async () => {
    // Validate
    const newErrors: ValidationErrors = {
      name: validateName(settings.profile.name),
      email: validateEmail(settings.profile.email),
    };

    setErrors(newErrors);

    if (newErrors.name || newErrors.email) {
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSaving(false);
    setSaveSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  }, [settings.profile.name, settings.profile.email]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-3xl font-bold text-transparent">
          Settings
        </h1>
        <p className="mt-1 text-gray-400">
          Manage your profile, notifications, appearance, and preferences
        </p>
      </div>

      {/* Profile Settings Section */}
      <SettingsSection
        title="Profile Settings"
        description="Manage your personal information and avatar"
        icon={User}
      >
        <SettingsInput
          label="Display Name"
          description="Your name as it appears to others"
          value={settings.profile.name}
          onChange={(value) => handleProfileChange('name', value)}
          placeholder="Enter your name"
          required
          error={errors.name}
        />
        <SettingsInput
          label="Email Address"
          description="Your primary email for notifications"
          value={settings.profile.email}
          onChange={(value) => handleProfileChange('email', value)}
          type="email"
          placeholder="Enter your email"
          required
          error={errors.email}
        />

        {/* Avatar Upload Placeholder */}
        <div className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-white/5">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Profile Avatar</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Upload a profile picture (PNG, JPG, max 2MB)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              {settings.profile.avatarUrl ? (
                <img
                  src={settings.profile.avatarUrl}
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white transition-colors hover:border-white/20 hover:bg-white/5"
              aria-label="Upload avatar"
            >
              <Camera className="h-4 w-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Notification Settings Section */}
      <NotificationSettings
        value={settings.notifications}
        onChange={handleNotificationChange}
      />

      {/* Theme Settings Section */}
      <ThemeSettings
        value={settings.theme}
        onChange={handleThemeChange}
        resolvedTheme={settings.theme.mode === 'system' ? 'dark' : settings.theme.mode}
      />

      {/* Response Templates Section */}
      <SettingsSection
        title="Response Templates"
        description="Create and manage quick response templates"
        icon={FileText}
        collapsible
        defaultCollapsed={false}
      >
        {/* Existing Templates */}
        <div className="space-y-3">
          {settings.templates.map((template) => (
            <div
              key={template.id}
              className="group flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-surface p-4 transition-colors hover:border-white/20"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-white">
                    {template.name}
                  </h4>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                    {template.category}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-gray-400">
                  {template.content}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(template.id)}
                className="rounded-lg p-2 text-gray-400 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Delete ${template.name} template`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {settings.templates.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-500" />
              <p className="mt-2 text-sm text-gray-400">
                No templates yet. Add your first template below.
              </p>
            </div>
          )}
        </div>

        {/* Add New Template Form */}
        {showNewTemplateForm ? (
          <div className="mt-4 space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h4 className="text-sm font-medium text-white">New Template</h4>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="template-name"
                  className="mb-1 block text-xs text-gray-400"
                >
                  Template Name *
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => {
                    setNewTemplate((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.templateName) {
                      setErrors((prev) => ({ ...prev, templateName: undefined }));
                    }
                  }}
                  placeholder="e.g., Follow-up Message"
                  className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.templateName && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.templateName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="template-content"
                  className="mb-1 block text-xs text-gray-400"
                >
                  Template Content *
                </label>
                <textarea
                  id="template-content"
                  value={newTemplate.content}
                  onChange={(e) => {
                    setNewTemplate((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }));
                    if (errors.templateContent) {
                      setErrors((prev) => ({
                        ...prev,
                        templateContent: undefined,
                      }));
                    }
                  }}
                  placeholder="Enter the template message..."
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.templateContent && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.templateContent}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="template-category"
                  className="mb-1 block text-xs text-gray-400"
                >
                  Category
                </label>
                <select
                  id="template-category"
                  value={newTemplate.category}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="general">General</option>
                  <option value="greeting">Greeting</option>
                  <option value="escalation">Escalation</option>
                  <option value="resolution">Resolution</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewTemplateForm(false);
                  setNewTemplate({ name: '', content: '', category: 'general' });
                  setErrors((prev) => ({
                    ...prev,
                    templateName: undefined,
                    templateContent: undefined,
                  }));
                }}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTemplate}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-primary/90"
              >
                Add Template
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewTemplateForm(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-3 text-sm text-gray-400 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Template</span>
          </button>
        )}
      </SettingsSection>

      {/* Danger Zone Section */}
      <SettingsSection
        title="Danger Zone"
        description="Irreversible actions and data management"
        icon={AlertTriangle}
        className="border-red-500/20"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-surface p-4">
            <div>
              <h4 className="text-sm font-medium text-white">
                Reset All Preferences
              </h4>
              <p className="mt-0.5 text-xs text-gray-400">
                Reset all settings to their default values. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetPreferences}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-surface p-4">
            <div>
              <h4 className="text-sm font-medium text-white">Export Data</h4>
              <p className="mt-0.5 text-xs text-gray-400">
                Download a JSON file containing all your settings and preferences.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface px-4 py-2 text-sm text-white transition-colors hover:border-white/20 hover:bg-white/5"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Sticky Save Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-sm text-green-400">
                Settings saved successfully!
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-black shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
