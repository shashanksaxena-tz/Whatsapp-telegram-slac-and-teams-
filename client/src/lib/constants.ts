/**
 * Shared constants for the customer components
 */

/**
 * Platform icon mapping for displaying platform identifiers
 */
export const platformIcons: Record<string, string> = {
  WHATSAPP: '📱',
  TELEGRAM: '✈️',
  SLACK: '💼',
  TEAMS: '🏢',
  WEB: '🌐',
};

/**
 * Platform colors for charts and visual elements
 * These colors match each platform's brand identity
 */
export const platformColors: Record<string, string> = {
  WHATSAPP: '#25D366',  // WhatsApp green
  TELEGRAM: '#0088CC',  // Telegram blue
  SLACK: '#4A154B',     // Slack purple
  TEAMS: '#6264A7',     // Teams purple
  WEB: '#6B7280',       // Neutral gray
};

/**
 * Sentiment colors for visualizations
 */
export const sentimentColors = {
  positive: '#22C55E',  // Green
  neutral: '#EAB308',   // Yellow
  negative: '#EF4444',  // Red
} as const;

/**
 * Chart color palette for general use
 */
export const chartColors = {
  primary: '#3B82F6',   // Blue
  secondary: '#8B5CF6', // Purple
  accent: '#10B981',    // Green
  warning: '#F59E0B',   // Amber
  danger: '#EF4444',    // Red
  muted: '#6B7280',     // Gray
} as const;

/**
 * Status colors for conversation charts
 */
export const statusColors = {
  resolved: '#22C55E',  // Green
  open: '#3B82F6',      // Blue
} as const;

/**
 * Platform display names for accessibility labels
 */
export const platformNames: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  SLACK: 'Slack',
  TEAMS: 'Microsoft Teams',
  WEB: 'Web',
};

/**
 * Safely parse a date string, returning null if invalid
 */
export function safeParseDate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}
