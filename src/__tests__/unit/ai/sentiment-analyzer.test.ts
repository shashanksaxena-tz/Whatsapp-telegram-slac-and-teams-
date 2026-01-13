import { SentimentAnalyzer } from '../../../ai/sentiment-analyzer';

describe('SentimentAnalyzer', () => {
  let analyzer: SentimentAnalyzer;

  beforeEach(() => {
    analyzer = new SentimentAnalyzer();
  });

  describe('analyze', () => {
    it('should detect very positive sentiment', () => {
      const result = analyzer.analyze('I absolutely love this! It is fantastic and wonderful!');
      
      expect(result.sentiment).toBe('very_positive');
      expect(result.score).toBeGreaterThan(2);
      expect(result.emotion).toBe('happy');
      expect(result.shouldEscalate).toBe(false);
    });

    it('should detect positive sentiment', () => {
      const result = analyzer.analyze('This is good and I like it');
      
      // Can be positive or very_positive depending on word weighting
      expect(['positive', 'very_positive']).toContain(result.sentiment);
      expect(result.score).toBeGreaterThan(0);
      expect(result.shouldEscalate).toBe(false);
    });

    it('should detect neutral sentiment', () => {
      const result = analyzer.analyze('The product arrived today');
      
      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(0);
      expect(result.shouldEscalate).toBe(false);
    });

    it('should detect negative sentiment', () => {
      const result = analyzer.analyze('This is bad and I don\'t like it');
      
      // Can be negative or very_negative depending on word weighting
      expect(['negative', 'very_negative']).toContain(result.sentiment);
      expect(result.score).toBeLessThan(0);
    });

    it('should detect very negative sentiment', () => {
      const result = analyzer.analyze('I hate this! It is terrible, awful, and horrible!');
      
      expect(result.sentiment).toBe('very_negative');
      expect(result.score).toBeLessThan(-2);
    });
  });

  describe('emotion detection', () => {
    it('should detect happy emotion', () => {
      const result = analyzer.analyze('I am so happy and excited about this!');
      expect(result.emotion).toBe('happy');
    });

    it('should detect angry emotion', () => {
      const result = analyzer.analyze('I am furious and angry about this service!');
      expect(result.emotion).toBe('angry');
    });
  });

  describe('escalation logic', () => {
    it('should escalate very negative sentiment', () => {
      const result = analyzer.analyze('This is absolutely terrible! I hate everything about it! Worst experience ever!');
      expect(result.shouldEscalate).toBe(true);
    });

    it('should not escalate positive sentiment', () => {
      const result = analyzer.analyze('This is great and I love it!');
      expect(result.shouldEscalate).toBe(false);
    });
  });

  describe('batch analysis', () => {
    it('should analyze multiple messages', () => {
      const messages = [
        'I love this!',
        'This is okay',
        'I hate this!'
      ];

      const results = analyzer.analyzeBatch(messages);

      expect(results).toHaveLength(3);
      expect(results[0].sentiment).toBe('very_positive');
      expect(results[1].sentiment).toBe('neutral');
      expect(results[2].sentiment).toBe('very_negative');
    });
  });
});
