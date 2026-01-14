import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Optional section description */
  description?: string;
  /** Optional icon to display alongside title */
  icon?: LucideIcon;
  /** Whether the section is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state (only used if collapsible is true) */
  defaultCollapsed?: boolean;
  /** Children elements to render inside the section */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className,
}: SettingsSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const headerContent = (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        )}
      </div>
      {collapsible && (
        <button
          type="button"
          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
        >
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <section
      className={cn(
        'rounded-xl border border-white/10 bg-surface p-6',
        className
      )}
    >
      {collapsible ? (
        <button
          type="button"
          className="w-full text-left"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
        >
          {headerContent}
        </button>
      ) : (
        headerContent
      )}

      {(!collapsible || !isCollapsed) && (
        <div
          className={cn(
            'mt-6 space-y-4',
            collapsible && 'animate-in slide-in-from-top-2 duration-200'
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}

export default SettingsSection;
