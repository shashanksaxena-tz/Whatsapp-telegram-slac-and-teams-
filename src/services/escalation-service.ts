export type EscalationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export class EscalationService {
  determineSeverity(sentimentScore: number, emotion: string): EscalationSeverity {
    // Critical: very negative sentiment OR angry emotion
    if (sentimentScore <= -4 || emotion === 'angry') {
      return 'CRITICAL';
    }

    // High: moderately negative OR frustrated
    if (sentimentScore <= -2 || emotion === 'frustrated') {
      return 'HIGH';
    }

    // Medium: slightly negative
    if (sentimentScore < 0) {
      return 'MEDIUM';
    }

    // Low: neutral or positive
    return 'LOW';
  }

  shouldAutoAssign(severity: EscalationSeverity): boolean {
    return severity === 'CRITICAL';
  }

  shouldNotifyManager(severity: EscalationSeverity): boolean {
    return severity === 'CRITICAL';
  }

  shouldSendPushNotification(severity: EscalationSeverity): boolean {
    return severity === 'CRITICAL' || severity === 'HIGH';
  }

  shouldPlaySound(severity: EscalationSeverity): boolean {
    return severity === 'CRITICAL';
  }

  getPriorityScore(severity: EscalationSeverity): number {
    switch (severity) {
      case 'CRITICAL': return 100;
      case 'HIGH': return 75;
      case 'MEDIUM': return 50;
      case 'LOW': return 25;
    }
  }
}
