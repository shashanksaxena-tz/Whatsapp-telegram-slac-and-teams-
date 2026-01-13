import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { AuthService } from '../auth';
import { logger } from '../utils/logger';

interface WSClient {
  ws: WebSocket;
  userId: string;
  role: string;
}

export type WSEventType =
  | 'escalation:new'
  | 'escalation:updated'
  | 'conversation:new'
  | 'conversation:updated'
  | 'message:new'
  | 'sentiment:update'
  | 'agent:typing';

export interface WSMessage {
  type: WSEventType;
  payload: any;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private authService: AuthService;

  constructor(server: Server, authService: AuthService) {
    this.authService = authService;
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupConnectionHandler();
  }

  private setupConnectionHandler() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'No token provided');
        return;
      }

      const payload = this.authService.verifyToken(token);
      if (!payload) {
        ws.close(4002, 'Invalid token');
        return;
      }

      const clientId = `${payload.userId}-${Date.now()}`;
      this.clients.set(clientId, { ws, userId: payload.userId, role: payload.role });

      logger.info(`WebSocket client connected: ${clientId}`);

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for ${clientId}:`, error);
      });

      // Send connection acknowledgment
      ws.send(JSON.stringify({ type: 'connected', payload: { clientId } }));
    });
  }

  broadcast(message: WSMessage) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  sendToUser(userId: string, message: WSMessage) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  sendToRole(role: string, message: WSMessage) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  sendToManagers(message: WSMessage) {
    this.sendToRole('MANAGER', message);
    this.sendToRole('ADMIN', message);
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
