import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  aiProvider: process.env.AI_PROVIDER || 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === 'true',
  },
  
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  
  slack: {
    enabled: process.env.SLACK_ENABLED === 'true',
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
  },
  
  teams: {
    enabled: process.env.TEAMS_ENABLED === 'true',
    appId: process.env.TEAMS_APP_ID,
    appPassword: process.env.TEAMS_APP_PASSWORD,
  },
  
  mcp: {
    enabled: process.env.MCP_SERVER_ENABLED === 'true',
    serverUrl: process.env.MCP_SERVER_URL,
    timeout: parseInt(process.env.MCP_SERVER_TIMEOUT || '30000', 10),
  },
  
  api: {
    authEnabled: process.env.API_AUTH_ENABLED === 'true',
    secretKey: process.env.API_SECRET_KEY,
  },
};
