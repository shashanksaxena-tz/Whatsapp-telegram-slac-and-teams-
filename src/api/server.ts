import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { MessageRouter } from '../core/message-router';
import { MCPClientImpl } from '../core/mcp-client';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

/**
 * REST API for interacting with the system
 */
export class APIServer {
  private app: express.Application;
  private router: MessageRouter;
  private mcpClient: MCPClientImpl | null;

  constructor(router: MessageRouter, mcpClient: MCPClientImpl | null = null) {
    this.app = express();
    this.router = router;
    this.mcpClient = mcpClient;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });

    // Authentication middleware
    if (config.api.authEnabled) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        
        if (req.path === '/health' || req.path === '/') {
          return next();
        }

        if (!authHeader || authHeader !== `Bearer ${config.api.secretKey}`) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        next();
      });
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Multi-Platform AI Integration API',
        version: '1.0.0',
        description: 'AI-powered integration for WhatsApp, Telegram, Slack, and Microsoft Teams',
        endpoints: {
          health: 'GET /health',
          mcp: 'POST /api/mcp',
          message: 'POST /api/message',
          platforms: 'GET /api/platforms',
        },
      });
    });

    // Get platform status
    this.app.get('/api/platforms', (req: Request, res: Response) => {
      const platforms = this.router.getRegisteredPlatforms();
      res.json({
        whatsapp: { 
          enabled: config.whatsapp.enabled,
          registered: platforms.includes('whatsapp')
        },
        telegram: { 
          enabled: config.telegram.enabled,
          registered: platforms.includes('telegram')
        },
        slack: { 
          enabled: config.slack.enabled,
          registered: platforms.includes('slack')
        },
        teams: { 
          enabled: config.teams.enabled,
          registered: platforms.includes('teams')
        },
      });
    });

    // Get system metrics for dashboard
    this.app.get('/api/metrics', (req: Request, res: Response) => {
      const platforms = this.router.getRegisteredPlatforms();
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Note: For production, use a proper CPU monitoring library like 'os-utils' or 'systeminformation'
      // This simplified calculation provides an approximation
      const cpuUsagePercent = this.getCPUUsagePercent();
      
      res.json({
        cpu: {
          usage: cpuUsagePercent.toFixed(2),
          unit: '%',
          note: 'Simplified calculation - use proper monitoring in production'
        },
        memory: {
          usage: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2),
          heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
          heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
          unit: '%'
        },
        uptime: {
          seconds: uptime,
          formatted: this.formatUptime(uptime)
        },
        platforms: {
          total: platforms.length,
          active: platforms
        },
        timestamp: new Date().toISOString()
      });
    });

    // Process natural language chat request
    this.app.post('/api/chat', async (req: Request, res: Response) => {
      try {
        const { message, context } = req.body;

        if (!message) {
          return res.status(400).json({ 
            error: 'Missing required field: message' 
          });
        }

        // Import AI provider dynamically to avoid circular dependencies
        const { createAIProvider } = require('../ai');
        const aiProvider = createAIProvider();

        // Process the natural language message
        const intent = await aiProvider.processNaturalLanguage(message, context);

        let result: any;
        
        if (this.mcpClient && intent.action !== 'error') {
          // Route to MCP server if available
          const mcpResponse = await this.mcpClient.request({
            method: intent.action,
            params: intent.entities,
            context: context || {},
          });
          result = mcpResponse.success ? mcpResponse.data : { error: mcpResponse.error };
        } else {
          // Use simulated response
          result = this.simulateAction(intent);
        }

        // Generate natural language response
        const responseText = await aiProvider.generateResponse(intent, result, context);

        res.json({
          success: true,
          intent,
          result,
          response: responseText,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        logger.error('Error processing chat request:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Send message via API
    this.app.post('/api/message', async (req: Request, res: Response) => {
      try {
        const { platform, chatId, text, metadata } = req.body;

        if (!platform || !chatId || !text) {
          return res.status(400).json({ 
            error: 'Missing required fields: platform, chatId, text' 
          });
        }

        // Use the message router to send the message through the appropriate platform adapter
        await this.router.sendMessage(platform, chatId, text, metadata);
        
        res.json({ 
          success: true, 
          message: 'Message sent successfully',
          data: { platform, chatId, text }
        });
      } catch (error: any) {
        logger.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Direct MCP request
    this.app.post('/api/mcp', async (req: Request, res: Response) => {
      try {
        if (!this.mcpClient) {
          return res.status(503).json({ 
            error: 'MCP client not enabled' 
          });
        }

        const { method, params, context } = req.body;

        if (!method) {
          return res.status(400).json({ 
            error: 'Missing required field: method' 
          });
        }

        const result = await this.mcpClient.request({
          method,
          params: params || {},
          context: context || {},
        });

        if (result.success) {
          res.json(result);
        } else {
          res.status(500).json(result);
        }
      } catch (error: any) {
        logger.error('Error processing MCP request:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Serve static files from the React frontend app
    const clientDistPath = path.join(__dirname, '../../client/dist');
    this.app.use(express.static(clientDistPath));

    // Handle SPA routing by returning index.html for unknown routes
    // This must be the last route handler
    this.app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  }

  private lastCpuUsage: { time: number; usage: NodeJS.CpuUsage } | null = null;

  private getCPUUsagePercent(): number {
    // Simple approximation based on process CPU usage
    // For production, use a library like 'os-utils' or 'systeminformation'
    const currentUsage = process.cpuUsage();
    const currentTime = Date.now();
    
    if (!this.lastCpuUsage) {
      this.lastCpuUsage = { time: currentTime, usage: currentUsage };
      // Return a default value on first call
      return 5.0;
    }
    
    const elapsedTime = (currentTime - this.lastCpuUsage.time) * 1000; // Convert to microseconds
    const userDiff = currentUsage.user - this.lastCpuUsage.usage.user;
    const systemDiff = currentUsage.system - this.lastCpuUsage.usage.system;
    const totalDiff = userDiff + systemDiff;
    
    // Calculate percentage (CPU time used / elapsed wall time)
    const cpuPercent = Math.min((totalDiff / elapsedTime) * 100, 100);
    
    // Update for next call
    this.lastCpuUsage = { time: currentTime, usage: currentUsage };
    
    return cpuPercent;
  }

  private simulateAction(intent: any): any {
    // Simulated action execution for demo purposes
    switch (intent.action) {
      case 'create':
        return { 
          success: true, 
          id: Date.now().toString(),
          message: `Created ${intent.entities.type || 'item'} successfully`,
          data: intent.entities,
        };
      case 'read':
      case 'query':
      case 'search':
        return {
          success: true,
          results: [
            { id: '1', name: 'Item 1', ...intent.entities },
            { id: '2', name: 'Item 2', ...intent.entities },
          ],
        };
      case 'update':
        return {
          success: true,
          message: `Updated ${intent.entities.type || 'item'} successfully`,
          data: intent.entities,
        };
      case 'delete':
        return {
          success: true,
          message: `Deleted ${intent.entities.type || 'item'} successfully`,
        };
      default:
        return {
          success: false,
          message: `I understand you want to ${intent.action}, but I'm not sure how to help with that yet.`,
        };
    }
  }

  start(port: number): void {
    this.app.listen(port, () => {
      logger.info(`API server listening on port ${port}`);
    });
  }
}
