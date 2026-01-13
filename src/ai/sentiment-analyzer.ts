// @ts-ignore - sentiment package doesn't have types
import Sentiment from 'sentiment';
import { logger } from '../utils/logger';

/**
 * Sentiment analysis result with detailed emotion detection
 */
export interface SentimentResult {
  score: number; // -5 to 5
  comparative: number; // Normalized score
  tokens: string[];
  positive: string[];
  negative: string[];
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  emotion: EmotionType;
  shouldEscalate: boolean;
}

export type EmotionType = 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'frustrated' 
  | 'neutral' 
  | 'excited' 
  | 'worried'
  | 'confused';

/**
 * Advanced sentiment analyzer with emotion detection and escalation logic
 */
export class SentimentAnalyzer {
  private analyzer: any;
  private emotionKeywords: Map<EmotionType, string[]> = new Map();

  constructor() {
    this.analyzer = new Sentiment();
    this.initializeEmotionKeywords();
  }

  private initializeEmotionKeywords(): void {
    this.emotionKeywords = new Map([
      ['happy', ['happy', 'joy', 'great', 'awesome', 'excellent', 'wonderful', 'fantastic', 'love', 'glad', 'pleased']],
      ['sad', ['sad', 'unhappy', 'disappointed', 'depressed', 'miserable', 'upset', 'down', 'blue']],
      ['angry', ['angry', 'furious', 'mad', 'rage', 'hate', 'enraged', 'livid', 'irate', 'outraged']],
      ['frustrated', ['frustrated', 'annoyed', 'irritated', 'fed up', 'tired of', 'sick of', 'annoying']],
      ['excited', ['excited', 'thrilled', 'eager', 'enthusiastic', 'pumped', 'stoked', 'can\'t wait']],
      ['worried', ['worried', 'concerned', 'anxious', 'nervous', 'uneasy', 'afraid', 'scared']],
      ['confused', ['confused', 'unclear', 'lost', 'don\'t understand', 'puzzled', 'perplexed', 'baffled']],
    ]);
  }

  /**
   * Analyze text sentiment with emotion detection
   */
  analyze(text: string): SentimentResult {
    const result = this.analyzer.analyze(text);
    const sentiment = this.getSentimentLabel(result.score);
    const emotion = this.detectEmotion(text.toLowerCase(), result);
    const shouldEscalate = this.shouldEscalateToHuman(result.score, emotion);

    logger.debug('Sentiment analysis:', {
      text: text.substring(0, 50),
      score: result.score,
      sentiment,
      emotion,
      shouldEscalate
    });

    return {
      score: result.score,
      comparative: result.comparative,
      tokens: result.tokens,
      positive: result.positive,
      negative: result.negative,
      sentiment,
      emotion,
      shouldEscalate
    };
  }

  private getSentimentLabel(score: number): SentimentResult['sentiment'] {
    if (score > 2) return 'very_positive';
    if (score > 0) return 'positive';
    if (score === 0) return 'neutral';
    if (score > -2) return 'negative';
    return 'very_negative';
  }

  private detectEmotion(text: string, sentimentResult: any): EmotionType {
    // Count emotion keyword matches
    const emotionScores = new Map<EmotionType, number>();

    for (const [emotion, keywords] of this.emotionKeywords.entries()) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > 0) {
        emotionScores.set(emotion, matches);
      }
    }

    // Return emotion with highest score
    if (emotionScores.size > 0) {
      const sorted = Array.from(emotionScores.entries())
        .sort((a, b) => b[1] - a[1]);
      return sorted[0][0];
    }

    // Fallback based on sentiment score
    if (sentimentResult.score > 2) return 'happy';
    if (sentimentResult.score > 0) return 'happy';
    if (sentimentResult.score < -2) return 'angry';
    if (sentimentResult.score < 0) return 'frustrated';
    return 'neutral';
  }

  /**
   * Determine if message should be escalated to human
   */
  private shouldEscalateToHuman(score: number, emotion: EmotionType): boolean {
    // Escalate if very negative sentiment
    if (score < -3) return true;

    // Escalate if angry or very frustrated
    if (emotion === 'angry') return true;

    // Escalate if multiple negative indicators
    if (score < -2 && emotion === 'frustrated') return true;

    return false;
  }

  /**
   * Get escalation reason for logging/routing
   */
  getEscalationReason(result: SentimentResult): string {
    if (result.score < -3) {
      return `Very negative sentiment detected (score: ${result.score})`;
    }
    if (result.emotion === 'angry') {
      return `Angry emotion detected`;
    }
    if (result.score < -2 && result.emotion === 'frustrated') {
      return `Customer is frustrated (sentiment: ${result.score}, emotion: ${result.emotion})`;
    }
    return 'Unknown escalation reason';
  }

  /**
   * Batch analyze multiple messages
   */
  analyzeBatch(messages: string[]): SentimentResult[] {
    return messages.map(msg => this.analyze(msg));
  }

  /**
   * Get aggregate sentiment for conversation
   */
  getConversationSentiment(messages: string[]): {
    averageScore: number;
    overallSentiment: SentimentResult['sentiment'];
    emotionDistribution: Record<EmotionType, number>;
  } {
    const results = this.analyzeBatch(messages);
    
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalScore / results.length;

    const emotionCounts: Record<string, number> = {};
    results.forEach(r => {
      emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
    });

    return {
      averageScore,
      overallSentiment: this.getSentimentLabel(averageScore),
      emotionDistribution: emotionCounts as Record<EmotionType, number>
    };
  }
}
