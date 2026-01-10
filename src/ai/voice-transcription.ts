// @ts-ignore - @google-cloud/speech has complex types
import speech from '@google-cloud/speech';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
  service: 'google' | 'openai';
}

export interface TranscriptionOptions {
  language?: string;
  model?: string;
  enableAutomaticPunctuation?: boolean;
  preferredService?: 'google' | 'openai' | 'auto';
}

/**
 * Voice transcription service supporting Google Cloud Speech-to-Text and OpenAI Whisper
 */
export class VoiceTranscriptionService {
  private googleClient: any | null = null;
  private openaiClient: OpenAI | null = null;
  private googleEnabled: boolean = false;
  private openaiEnabled: boolean = false;

  constructor(
    googleCredentials?: any,
    openaiApiKey?: string
  ) {
    // Initialize Google Cloud Speech if credentials provided
    if (googleCredentials) {
      try {
        // @ts-ignore
        const { SpeechClient } = speech;
        this.googleClient = new SpeechClient({
          credentials: googleCredentials
        });
        this.googleEnabled = true;
        logger.info('Google Cloud Speech-to-Text initialized');
      } catch (error) {
        logger.warn('Failed to initialize Google Speech client:', error);
      }
    }

    // Initialize OpenAI Whisper if API key provided
    if (openaiApiKey) {
      try {
        this.openaiClient = new OpenAI({ apiKey: openaiApiKey });
        this.openaiEnabled = true;
        logger.info('OpenAI Whisper initialized');
      } catch (error) {
        logger.warn('Failed to initialize OpenAI client:', error);
      }
    }

    if (!this.googleEnabled && !this.openaiEnabled) {
      logger.warn('No transcription services enabled. Provide Google credentials or OpenAI API key.');
    }
  }

  /**
   * Transcribe audio from buffer
   */
  async transcribe(
    audioBuffer: Buffer,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const service = this.selectService(options.preferredService);

    if (service === 'google') {
      return await this.transcribeWithGoogle(audioBuffer, options);
    } else if (service === 'openai') {
      return await this.transcribeWithOpenAI(audioBuffer, options);
    } else {
      throw new Error('No transcription service available');
    }
  }

  /**
   * Transcribe audio file from path
   */
  async transcribeFile(
    filePath: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const fs = require('fs');
    const audioBuffer = fs.readFileSync(filePath);
    return await this.transcribe(audioBuffer, options);
  }

  /**
   * Transcribe audio using Google Cloud Speech-to-Text
   */
  private async transcribeWithGoogle(
    audioBuffer: Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    if (!this.googleClient) {
      throw new Error('Google Speech client not initialized');
    }

    const audio = {
      content: audioBuffer.toString('base64'),
    };

    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode: options.language || 'en-US',
      enableAutomaticPunctuation: options.enableAutomaticPunctuation ?? true,
      model: options.model || 'default',
    };

    const request = {
      audio: audio,
      config: config,
    };

    logger.debug('Transcribing with Google Cloud Speech-to-Text');
    const startTime = Date.now();

    const [response] = await this.googleClient.recognize(request);
    const transcription = response.results
      ?.map((result: any) => result.alternatives?.[0].transcript)
      .join('\n') || '';

    const confidence = response.results?.[0]?.alternatives?.[0]?.confidence || 0;
    const duration = Date.now() - startTime;

    logger.info(`Google transcription completed in ${duration}ms`);

    return {
      text: transcription,
      confidence,
      language: options.language || 'en-US',
      duration,
      service: 'google'
    };
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  private async transcribeWithOpenAI(
    audioBuffer: Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    logger.debug('Transcribing with OpenAI Whisper');
    const startTime = Date.now();

    // Create a File-like object from buffer
    const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    const response = await this.openaiClient.audio.transcriptions.create({
      file: file,
      model: options.model || 'whisper-1',
      language: options.language,
      response_format: 'verbose_json',
    });

    const duration = Date.now() - startTime;

    logger.info(`OpenAI Whisper transcription completed in ${duration}ms`);

    return {
      text: response.text,
      confidence: 0.95, // Whisper doesn't provide confidence scores
      language: options.language || response.language,
      duration,
      service: 'openai'
    };
  }

  /**
   * Select which service to use based on preference and availability
   */
  private selectService(preferred?: 'google' | 'openai' | 'auto'): 'google' | 'openai' {
    if (preferred === 'google' && this.googleEnabled) {
      return 'google';
    }
    if (preferred === 'openai' && this.openaiEnabled) {
      return 'openai';
    }

    // Auto-select or fallback
    if (this.openaiEnabled) return 'openai'; // Prefer OpenAI (Whisper is more accurate)
    if (this.googleEnabled) return 'google';

    throw new Error('No transcription service enabled');
  }

  /**
   * Transcribe with fallback - tries preferred service, falls back to alternative
   */
  async transcribeWithFallback(
    audioBuffer: Buffer,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const primary = this.selectService(options.preferredService);
    const fallback = primary === 'google' ? 'openai' : 'google';

    try {
      return await this.transcribe(audioBuffer, { ...options, preferredService: primary });
    } catch (error) {
      logger.warn(`Primary transcription service (${primary}) failed, trying fallback (${fallback})`);
      
      // Check if fallback is available
      if ((fallback === 'google' && !this.googleEnabled) || 
          (fallback === 'openai' && !this.openaiEnabled)) {
        throw error; // Re-throw if no fallback available
      }

      return await this.transcribe(audioBuffer, { ...options, preferredService: fallback });
    }
  }

  /**
   * Batch transcribe multiple audio files
   */
  async transcribeBatch(
    audioBuffers: Buffer[],
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult[]> {
    const results = await Promise.all(
      audioBuffers.map((buffer: Buffer) => 
        this.transcribeWithFallback(buffer, options)
          .catch((error: any) => {
            logger.error('Batch transcription error:', error);
            return {
              text: '',
              confidence: 0,
              service: 'google' as const,
              duration: 0
            };
          })
      )
    );

    return results;
  }

  /**
   * Check service availability
   */
  getAvailableServices(): { google: boolean; openai: boolean } {
    return {
      google: this.googleEnabled,
      openai: this.openaiEnabled
    };
  }

  /**
   * Get service statistics
   */
  getServiceInfo(): {
    google: { enabled: boolean; name: string };
    openai: { enabled: boolean; name: string };
  } {
    return {
      google: {
        enabled: this.googleEnabled,
        name: 'Google Cloud Speech-to-Text'
      },
      openai: {
        enabled: this.openaiEnabled,
        name: 'OpenAI Whisper'
      }
    };
  }
}
