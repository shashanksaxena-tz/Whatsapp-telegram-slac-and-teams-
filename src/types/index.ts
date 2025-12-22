/**
 * Common types for the multi-platform integration system
 */

export enum Platform {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  SLACK = 'slack',
  TEAMS = 'teams',
}

export interface Message {
  id: string;
  platform: Platform;
  userId: string;
  userName?: string;
  chatId: string;
  text: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Response {
  text: string;
  platform: Platform;
  chatId: string;
  metadata?: Record<string, any>;
}

export interface Intent {
  action: string;
  entities: Record<string, any>;
  confidence: number;
}

export interface MCPRequest {
  method: string;
  params?: Record<string, any>;
  context?: Record<string, any>;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface PlatformAdapter {
  platform: Platform;
  initialize(): Promise<void>;
  sendMessage(chatId: string, message: string, metadata?: Record<string, any>): Promise<void>;
  onMessage(handler: (message: Message) => Promise<void>): void;
  disconnect(): Promise<void>;
}

export interface AIProvider {
  processNaturalLanguage(text: string, context?: Record<string, any>): Promise<Intent>;
  generateResponse(intent: Intent, data: any, context?: Record<string, any>): Promise<string>;
}

export interface MCPClient {
  connect(url: string): Promise<void>;
  request(req: MCPRequest): Promise<MCPResponse>;
  disconnect(): Promise<void>;
}

export interface Config {
  port: number;
  aiProvider: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  whatsapp: {
    enabled: boolean;
  };
  telegram: {
    enabled: boolean;
    botToken?: string;
  };
  slack: {
    enabled: boolean;
    botToken?: string;
    signingSecret?: string;
    appToken?: string;
  };
  teams: {
    enabled: boolean;
    appId?: string;
    appPassword?: string;
  };
  mcp: {
    enabled: boolean;
    serverUrl?: string;
    timeout: number;
  };
  api: {
    authEnabled: boolean;
    secretKey?: string;
  };
}
