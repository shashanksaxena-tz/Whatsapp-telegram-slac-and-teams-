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
