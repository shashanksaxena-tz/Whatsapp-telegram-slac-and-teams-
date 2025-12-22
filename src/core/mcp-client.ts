import axios, { AxiosInstance } from 'axios';
import { MCPClient, MCPRequest, MCPResponse } from '../types';
import { logger } from '../utils/logger';

/**
 * MCP (Model Context Protocol) Client
 * Handles communication with MCP servers for AI agent interactions
 */
export class MCPClientImpl implements MCPClient {
  private client: AxiosInstance | null = null;
  private serverUrl: string = '';
  private timeout: number;

  constructor(timeout: number = 30000) {
    this.timeout = timeout;
  }

  async connect(url: string): Promise<void> {
    this.serverUrl = url;
    this.client = axios.create({
      baseURL: url,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    logger.info(`MCP Client connected to ${url}`);
  }

  async request(req: MCPRequest): Promise<MCPResponse> {
    if (!this.client) {
      throw new Error('MCP Client not connected. Call connect() first.');
    }

    try {
      logger.debug('MCP Request:', req);
      
      const response = await this.client.post('/rpc', {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method: req.method,
        params: req.params || {},
      });

      logger.debug('MCP Response:', response.data);

      if (response.data.error) {
        return {
          success: false,
          error: response.data.error.message || 'MCP request failed',
        };
      }

      return {
        success: true,
        data: response.data.result,
      };
    } catch (error: any) {
      logger.error('MCP request error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to communicate with MCP server',
      };
    }
  }

  async disconnect(): Promise<void> {
    this.client = null;
    logger.info('MCP Client disconnected');
  }
}
