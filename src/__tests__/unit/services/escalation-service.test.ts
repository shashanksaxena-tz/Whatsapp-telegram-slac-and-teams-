import { EscalationService, EscalationSeverity } from '../../../services/escalation-service';

describe('EscalationService', () => {
  let service: EscalationService;

  beforeEach(() => {
    service = new EscalationService();
  });

  describe('determineSeverity', () => {
    it('should return CRITICAL for sentiment <= -4', () => {
      const severity = service.determineSeverity(-4.5, 'angry');
      expect(severity).toBe('CRITICAL');
    });

    it('should return CRITICAL for angry emotion regardless of score', () => {
      const severity = service.determineSeverity(-2, 'angry');
      expect(severity).toBe('CRITICAL');
    });

    it('should return HIGH for sentiment <= -2', () => {
      const severity = service.determineSeverity(-2.5, 'frustrated');
      expect(severity).toBe('HIGH');
    });

    it('should return HIGH for frustrated emotion', () => {
      const severity = service.determineSeverity(-1, 'frustrated');
      expect(severity).toBe('HIGH');
    });

    it('should return MEDIUM for negative sentiment', () => {
      const severity = service.determineSeverity(-0.5, 'neutral');
      expect(severity).toBe('MEDIUM');
    });

    it('should return LOW for neutral or positive sentiment', () => {
      const severity = service.determineSeverity(0.5, 'neutral');
      expect(severity).toBe('LOW');
    });
  });

  describe('shouldAutoAssign', () => {
    it('should auto-assign for CRITICAL severity', () => {
      expect(service.shouldAutoAssign('CRITICAL')).toBe(true);
    });

    it('should not auto-assign for HIGH severity', () => {
      expect(service.shouldAutoAssign('HIGH')).toBe(false);
    });

    it('should not auto-assign for MEDIUM or LOW', () => {
      expect(service.shouldAutoAssign('MEDIUM')).toBe(false);
      expect(service.shouldAutoAssign('LOW')).toBe(false);
    });
  });

  describe('shouldNotifyManager', () => {
    it('should notify manager for CRITICAL severity', () => {
      expect(service.shouldNotifyManager('CRITICAL')).toBe(true);
    });

    it('should not notify manager for other severities', () => {
      expect(service.shouldNotifyManager('HIGH')).toBe(false);
      expect(service.shouldNotifyManager('MEDIUM')).toBe(false);
      expect(service.shouldNotifyManager('LOW')).toBe(false);
    });
  });
});
