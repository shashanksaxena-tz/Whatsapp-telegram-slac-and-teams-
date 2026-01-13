# Unified Support Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive customer support dashboard with sentiment-aware escalation across WhatsApp, Telegram, Slack, and Teams.

**Architecture:** Monolithic React frontend with Express backend. PostgreSQL for persistence. WebSocket for real-time updates. Zustand for state management. Sentiment analysis via the existing sentiment-analyzer module.

**Tech Stack:** React 18, TypeScript, TailwindCSS, Express, PostgreSQL, Prisma ORM, WebSocket (ws), Zustand, Recharts

---

## Phase 0: Prerequisites

### Task 0.1: Merge Sentiment Engine Branch

**Context:** The `copilot/check-mock-implementations` branch contains sentiment analysis, voice transcription, and vector memory modules we need.

**Step 1: Fetch and review the branch**

```bash
git fetch origin copilot/check-mock-implementations
git log origin/copilot/check-mock-implementations --oneline -10
```

**Step 2: Merge the branch into our feature branch**

```bash
git merge origin/copilot/check-mock-implementations --no-edit
```

**Step 3: Verify merge succeeded and resolve any conflicts**

```bash
git status
npm run build
```

Expected: Build succeeds with no errors

**Step 4: Run tests to verify nothing broke**

```bash
npm test
```

Expected: All tests pass

**Step 5: Commit if there were conflict resolutions**

```bash
git add .
git commit -m "chore: merge sentiment engine from check-mock-implementations"
```

---

### Task 0.2: Install Additional Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install backend dependencies**

```bash
npm install prisma @prisma/client ws jsonwebtoken bcryptjs cookie-parser
npm install -D @types/ws @types/jsonwebtoken @types/bcryptjs @types/cookie-parser
```

**Step 2: Install client dependencies**

```bash
cd client
npm install zustand @tanstack/react-query recharts date-fns
npm install -D @types/recharts
cd ..
```

**Step 3: Verify installation**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add package.json package-lock.json client/package.json client/package-lock.json
git commit -m "chore: add prisma, websocket, auth, and state management dependencies"
```

---

### Task 0.3: Initialize Prisma and Database Schema

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: Initialize Prisma**

```bash
npx prisma init
```

**Step 2: Create the database schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  AGENT
  MANAGER
  ADMIN
}

enum Platform {
  WHATSAPP
  TELEGRAM
  SLACK
  TEAMS
  WEB
}

enum ConversationStatus {
  OPEN
  PENDING
  RESOLVED
  CLOSED
}

enum EscalationSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          UserRole @default(AGENT)
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  preferences       UserPreference?
  assignedConversations Conversation[] @relation("AssignedAgent")
  escalationsAssigned   Escalation[]   @relation("AssignedTo")
  escalationsTriggered  Escalation[]   @relation("TriggeredBy")
  internalNotes         InternalNote[]
  responseTemplates     ResponseTemplate[]
}

model UserPreference {
  id                    String  @id @default(cuid())
  userId                String  @unique
  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  theme                 String  @default("dark")
  notificationsJson     Json    @default("{}")
  soundsJson            Json    @default("{}")
}

model Customer {
  id           String   @id @default(cuid())
  email        String?
  phone        String?
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  mergedIntoId String?
  mergedInto   Customer? @relation("MergedCustomers", fields: [mergedIntoId], references: [id])
  mergedFrom   Customer[] @relation("MergedCustomers")

  identities    CustomerIdentity[]
  conversations Conversation[]
}

model CustomerIdentity {
  id              String   @id @default(cuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  platform        Platform
  platformUserId  String
  platformUsername String?
  createdAt       DateTime @default(now())

  @@unique([platform, platformUserId])
}

model Conversation {
  id              String             @id @default(cuid())
  customerId      String
  customer        Customer           @relation(fields: [customerId], references: [id])
  platform        Platform
  status          ConversationStatus @default(OPEN)
  assignedAgentId String?
  assignedAgent   User?              @relation("AssignedAgent", fields: [assignedAgentId], references: [id])
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  resolvedAt      DateTime?

  messages      Message[]
  escalations   Escalation[]
  internalNotes InternalNote[]
}

model Message {
  id                String   @id @default(cuid())
  conversationId    String
  conversation      Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderType        String   // 'customer', 'agent', 'bot'
  senderId          String?
  content           String
  sentimentScore    Float?
  emotion           String?
  platformMessageId String?
  createdAt         DateTime @default(now())
}

model Escalation {
  id              String             @id @default(cuid())
  conversationId  String
  conversation    Conversation       @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  severity        EscalationSeverity
  triggeredById   String?
  triggeredBy     User?              @relation("TriggeredBy", fields: [triggeredById], references: [id])
  assignedToId    String?
  assignedTo      User?              @relation("AssignedTo", fields: [assignedToId], references: [id])
  resolvedAt      DateTime?
  createdAt       DateTime           @default(now())
}

model InternalNote {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id])
  content        String
  createdAt      DateTime     @default(now())
}

model ResponseTemplate {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  title     String
  content   String
  isGlobal  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model DailyMetric {
  id                    String   @id @default(cuid())
  date                  DateTime @db.Date
  platform              Platform
  totalConversations    Int      @default(0)
  avgSentiment          Float    @default(0)
  resolutionRate        Float    @default(0)
  avgResponseTimeSeconds Int     @default(0)

  @@unique([date, platform])
}
```

**Step 3: Add DATABASE_URL to .env.example**

Add to `.env.example`:
```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/support_dashboard?schema=public"
```

**Step 4: Generate Prisma client**

```bash
npx prisma generate
```

**Step 5: Commit**

```bash
git add prisma/ .env.example
git commit -m "feat: add prisma schema for support dashboard"
```

---

## Phase 1: Backend Foundation

### Task 1.1: Create Prisma Database Service

**Files:**
- Create: `src/db/prisma.ts`
- Create: `src/db/index.ts`

**Step 1: Create Prisma client singleton**

Create `src/db/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Step 2: Create index export**

Create `src/db/index.ts`:

```typescript
export { prisma } from './prisma';
```

**Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/db/
git commit -m "feat: add prisma database service"
```

---

### Task 1.2: Create Authentication Service

**Files:**
- Create: `src/auth/auth-service.ts`
- Create: `src/auth/auth-middleware.ts`
- Create: `src/auth/index.ts`
- Test: `src/__tests__/unit/auth/auth-service.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/unit/auth/auth-service.test.ts`:

```typescript
import { AuthService } from '../../../auth/auth-service';

// Mock prisma
jest.mock('../../../db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService('test-secret');
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await authService.hashPassword('password123');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('password123');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await authService.hashPassword('password123');
      const isValid = await authService.verifyPassword('password123', hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await authService.hashPassword('password123');
      const isValid = await authService.verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = authService.generateToken({ userId: '123', role: 'AGENT' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = authService.generateToken({ userId: '123', role: 'AGENT' });
      const decoded = authService.verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('123');
      expect(decoded?.role).toBe('AGENT');
    });

    it('should return null for invalid token', () => {
      const decoded = authService.verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/unit/auth/auth-service.test.ts
```

Expected: FAIL with "Cannot find module '../../../auth/auth-service'"

**Step 3: Implement AuthService**

Create `src/auth/auth-service.ts`:

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  role: UserRole | string;
}

export class AuthService {
  private jwtSecret: string;
  private tokenExpiry: string;

  constructor(jwtSecret: string, tokenExpiry: string = '24h') {
    this.jwtSecret = jwtSecret;
    this.tokenExpiry = tokenExpiry;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiry });
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }
}
```

**Step 4: Create auth middleware**

Create `src/auth/auth-middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from './auth-service';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function createAuthMiddleware(authService: AuthService) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = payload;
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
```

**Step 5: Create index export**

Create `src/auth/index.ts`:

```typescript
export { AuthService, TokenPayload } from './auth-service';
export { createAuthMiddleware, requireRole, AuthenticatedRequest } from './auth-middleware';
```

**Step 6: Run tests to verify they pass**

```bash
npm test -- src/__tests__/unit/auth/auth-service.test.ts
```

Expected: All tests PASS

**Step 7: Commit**

```bash
git add src/auth/ src/__tests__/unit/auth/
git commit -m "feat: add authentication service with JWT tokens"
```

---

### Task 1.3: Create WebSocket Service

**Files:**
- Create: `src/realtime/websocket-service.ts`
- Create: `src/realtime/index.ts`

**Step 1: Create WebSocket service**

Create `src/realtime/websocket-service.ts`:

```typescript
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
```

**Step 2: Create index export**

Create `src/realtime/index.ts`:

```typescript
export { WebSocketService, WSEventType, WSMessage } from './websocket-service';
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/realtime/
git commit -m "feat: add websocket service for real-time updates"
```

---

### Task 1.4: Create Escalation Service

**Files:**
- Create: `src/services/escalation-service.ts`
- Test: `src/__tests__/unit/services/escalation-service.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/unit/services/escalation-service.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/unit/services/escalation-service.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Implement EscalationService**

Create `src/services/escalation-service.ts`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- src/__tests__/unit/services/escalation-service.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/services/ src/__tests__/unit/services/
git commit -m "feat: add escalation service with severity determination"
```

---

### Task 1.5: Create API Routes for Auth

**Files:**
- Create: `src/api/routes/auth-routes.ts`

**Step 1: Create auth routes**

Create `src/api/routes/auth-routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { AuthService, createAuthMiddleware, AuthenticatedRequest } from '../../auth';

export function createAuthRoutes(authService: AuthService) {
  const router = Router();

  // POST /api/auth/login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await authService.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = authService.generateToken({ userId: user.id, role: user.role });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/auth/register (admin only in production)
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name, role = 'AGENT' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name required' });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const passwordHash = await authService.hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: role as any,
        },
      });

      const token = authService.generateToken({ userId: user.id, role: user.role });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/auth/me
  const authMiddleware = createAuthMiddleware(authService);
  router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { preferences: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/auth/logout
  router.post('/logout', authMiddleware, (_req: Request, res: Response) => {
    // JWT is stateless, logout is client-side
    res.json({ success: true });
  });

  return router;
}
```

**Step 2: Create routes index**

Create `src/api/routes/index.ts`:

```typescript
export { createAuthRoutes } from './auth-routes';
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/api/routes/
git commit -m "feat: add authentication API routes"
```

---

## Phase 2: Frontend Foundation

### Task 2.1: Set Up Zustand Store

**Files:**
- Create: `client/src/stores/auth-store.ts`
- Create: `client/src/stores/realtime-store.ts`
- Create: `client/src/stores/index.ts`

**Step 1: Create auth store**

Create `client/src/stores/auth-store.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'AGENT' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

**Step 2: Create realtime store**

Create `client/src/stores/realtime-store.ts`:

```typescript
import { create } from 'zustand';

export type EscalationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Escalation {
  id: string;
  conversationId: string;
  severity: EscalationSeverity;
  customerName: string;
  platform: string;
  lastMessage: string;
  sentimentScore: number;
  emotion: string;
  waitTime: number;
  createdAt: string;
}

export interface LiveConversation {
  id: string;
  customerId: string;
  customerName: string;
  platform: string;
  agentId?: string;
  agentName?: string;
  lastMessage: string;
  sentimentScore: number;
  status: string;
  isTyping: boolean;
  updatedAt: string;
}

export interface RealtimeState {
  escalationQueue: Escalation[];
  liveConversations: Map<string, LiveConversation>;
  wsConnected: boolean;

  setEscalationQueue: (queue: Escalation[]) => void;
  addEscalation: (escalation: Escalation) => void;
  removeEscalation: (id: string) => void;
  updateEscalation: (id: string, updates: Partial<Escalation>) => void;

  setLiveConversation: (conv: LiveConversation) => void;
  removeLiveConversation: (id: string) => void;

  setWsConnected: (connected: boolean) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  escalationQueue: [],
  liveConversations: new Map(),
  wsConnected: false,

  setEscalationQueue: (queue) => set({ escalationQueue: queue }),

  addEscalation: (escalation) => set((state) => ({
    escalationQueue: [escalation, ...state.escalationQueue].sort(
      (a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
    ),
  })),

  removeEscalation: (id) => set((state) => ({
    escalationQueue: state.escalationQueue.filter((e) => e.id !== id),
  })),

  updateEscalation: (id, updates) => set((state) => ({
    escalationQueue: state.escalationQueue.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    ),
  })),

  setLiveConversation: (conv) => set((state) => {
    const newMap = new Map(state.liveConversations);
    newMap.set(conv.id, conv);
    return { liveConversations: newMap };
  }),

  removeLiveConversation: (id) => set((state) => {
    const newMap = new Map(state.liveConversations);
    newMap.delete(id);
    return { liveConversations: newMap };
  }),

  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
```

**Step 3: Create index export**

Create `client/src/stores/index.ts`:

```typescript
export { useAuthStore, type User, type UserRole, type AuthState } from './auth-store';
export {
  useRealtimeStore,
  type Escalation,
  type LiveConversation,
  type EscalationSeverity,
  type RealtimeState
} from './realtime-store';
```

**Step 4: Verify client builds**

```bash
cd client && npm run build && cd ..
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add client/src/stores/
git commit -m "feat: add zustand stores for auth and realtime state"
```

---

### Task 2.2: Create Theme Provider

**Files:**
- Create: `client/src/components/common/ThemeProvider.tsx`
- Modify: `client/src/main.tsx`

**Step 1: Create ThemeProvider**

Create `client/src/components/common/ThemeProvider.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'auto';
type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(resolvedTheme);
    localStorage.setItem('theme', theme);
  }, [theme, resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Step 2: Update main.tsx to use ThemeProvider**

Modify `client/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ThemeProvider } from './components/common/ThemeProvider';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Step 3: Verify client builds**

```bash
cd client && npm run build && cd ..
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add client/src/components/common/ThemeProvider.tsx client/src/main.tsx
git commit -m "feat: add theme provider with dark/light/auto modes"
```

---

### Task 2.3: Create API Client and WebSocket Hook

**Files:**
- Create: `client/src/lib/api.ts`
- Create: `client/src/hooks/useWebSocket.ts`
- Create: `client/src/hooks/index.ts`

**Step 1: Create API client**

Create `client/src/lib/api.ts`:

```typescript
import { useAuthStore } from '../stores';

const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }
    return response.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, role?: string) =>
    api.post<{ token: string; user: any }>('/auth/register', { email, password, name, role }),
  me: () => api.get<any>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Conversations API
export const conversationsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any[]>(`/conversations${query}`);
  },
  get: (id: string) => api.get<any>(`/conversations/${id}`),
  assign: (id: string, agentId: string) =>
    api.post(`/conversations/${id}/assign`, { agentId }),
  resolve: (id: string) => api.post(`/conversations/${id}/resolve`),
  reply: (id: string, content: string) =>
    api.post(`/conversations/${id}/reply`, { content }),
};

// Escalations API
export const escalationsApi = {
  list: () => api.get<any[]>('/escalations'),
  assign: (id: string, agentId: string) =>
    api.post(`/escalations/${id}/assign`, { agentId }),
  resolve: (id: string) => api.post(`/escalations/${id}/resolve`),
};

// Customers API
export const customersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any[]>(`/customers${query}`);
  },
  get: (id: string) => api.get<any>(`/customers/${id}`),
  merge: (id: string, targetId: string) =>
    api.post(`/customers/${id}/merge`, { targetId }),
};

// Analytics API
export const analyticsApi = {
  summary: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any>(`/analytics/summary${query}`);
  },
  sentiment: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any>(`/analytics/sentiment${query}`);
  },
  agents: () => api.get<any[]>('/analytics/agents'),
};
```

**Step 2: Create WebSocket hook**

Create `client/src/hooks/useWebSocket.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { useRealtimeStore } from '../stores/realtime-store';

type WSEventType =
  | 'escalation:new'
  | 'escalation:updated'
  | 'conversation:new'
  | 'conversation:updated'
  | 'message:new'
  | 'sentiment:update';

interface WSMessage {
  type: WSEventType | 'connected';
  payload: any;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const { token, isAuthenticated } = useAuthStore();
  const { setWsConnected, addEscalation, updateEscalation, setLiveConversation } = useRealtimeStore();

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [token, isAuthenticated, setWsConnected]);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket authenticated:', message.payload.clientId);
        break;
      case 'escalation:new':
        addEscalation(message.payload);
        break;
      case 'escalation:updated':
        updateEscalation(message.payload.id, message.payload);
        break;
      case 'conversation:new':
      case 'conversation:updated':
        setLiveConversation(message.payload);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [addEscalation, updateEscalation, setLiveConversation]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return wsRef.current;
}
```

**Step 3: Create hooks index**

Create `client/src/hooks/index.ts`:

```typescript
export { useWebSocket } from './useWebSocket';
```

**Step 4: Verify client builds**

```bash
cd client && npm run build && cd ..
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add client/src/lib/api.ts client/src/hooks/
git commit -m "feat: add API client and WebSocket hook"
```

---

## Phase 3: Command Center UI

### Task 3.1: Create Severity Badge Component

**Files:**
- Create: `client/src/components/common/SeverityBadge.tsx`

**Step 1: Create the component**

Create `client/src/components/common/SeverityBadge.tsx`:

```typescript
import React from 'react';
import { cn } from '../../lib/utils';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface SeverityBadgeProps {
  severity: Severity;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const severityConfig = {
  CRITICAL: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    dot: 'bg-red-500',
    label: 'Critical',
  },
  HIGH: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
    label: 'High',
  },
  MEDIUM: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
    label: 'Medium',
  },
  LOW: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    dot: 'bg-green-500',
    label: 'Low',
  },
};

const sizeConfig = {
  sm: { dot: 'h-2 w-2', text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { dot: 'h-2.5 w-2.5', text: 'text-sm', padding: 'px-2.5 py-1' },
  lg: { dot: 'h-3 w-3', text: 'text-base', padding: 'px-3 py-1.5' },
};

export function SeverityBadge({
  severity,
  showLabel = true,
  size = 'md',
  pulse = false
}: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bg,
        config.border,
        config.text,
        sizes.padding,
        sizes.text
      )}
    >
      <span
        className={cn(
          'rounded-full',
          config.dot,
          sizes.dot,
          pulse && 'animate-pulse'
        )}
      />
      {showLabel && config.label}
    </span>
  );
}
```

**Step 2: Verify build**

```bash
cd client && npm run build && cd ..
```

**Step 3: Commit**

```bash
git add client/src/components/common/SeverityBadge.tsx
git commit -m "feat: add severity badge component"
```

---

### Task 3.2: Create Priority Queue Component

**Files:**
- Create: `client/src/components/command-center/PriorityQueue.tsx`

**Step 1: Create the component**

Create `client/src/components/command-center/PriorityQueue.tsx`:

```typescript
import React from 'react';
import { Clock, MessageCircle, User, ArrowRight } from 'lucide-react';
import { SeverityBadge, Severity } from '../common/SeverityBadge';
import { cn } from '../../lib/utils';

interface QueueItem {
  id: string;
  customerName: string;
  platform: string;
  lastMessage: string;
  sentimentScore: number;
  emotion: string;
  severity: Severity;
  waitTimeMinutes: number;
  createdAt: string;
}

interface PriorityQueueProps {
  items: QueueItem[];
  onView: (id: string) => void;
  onAssign: (id: string) => void;
  onEscalate?: (id: string) => void;
}

const platformIcons: Record<string, string> = {
  WHATSAPP: '📱',
  TELEGRAM: '✈️',
  SLACK: '💼',
  TEAMS: '🏢',
  WEB: '🌐',
};

export function PriorityQueue({ items, onView, onAssign, onEscalate }: PriorityQueueProps) {
  if (items.length === 0) {
    return (
      <div className="bg-glass border border-glass-border rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Priority Queue</h3>
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No escalations in queue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-glass border border-glass-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Priority Queue</h3>
        <span className="text-sm text-gray-400">{items.length} items</span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'p-4 rounded-lg border transition-all hover:bg-white/5',
              item.severity === 'CRITICAL' && 'border-red-500/30 bg-red-500/5',
              item.severity === 'HIGH' && 'border-orange-500/30 bg-orange-500/5',
              item.severity === 'MEDIUM' && 'border-yellow-500/30 bg-yellow-500/5',
              item.severity === 'LOW' && 'border-glass-border'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge
                    severity={item.severity}
                    size="sm"
                    pulse={item.severity === 'CRITICAL'}
                  />
                  <span className="text-lg">{platformIcons[item.platform] || '💬'}</span>
                  <span className="font-medium truncate">{item.customerName}</span>
                </div>

                <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                  "{item.lastMessage}"
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.waitTimeMinutes}m
                  </span>
                  <span>
                    Sentiment: {item.sentimentScore.toFixed(1)} | {item.emotion}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onView(item.id)}
                  className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => onAssign(item.id)}
                  className="px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors"
                >
                  Assign
                </button>
                {onEscalate && item.severity !== 'CRITICAL' && (
                  <button
                    onClick={() => onEscalate(item.id)}
                    className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors flex items-center gap-1"
                  >
                    Escalate <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
cd client && npm run build && cd ..
```

**Step 3: Commit**

```bash
git add client/src/components/command-center/PriorityQueue.tsx
git commit -m "feat: add priority queue component for escalations"
```

---

### Task 3.3: Create Sentiment Heatmap Component

**Files:**
- Create: `client/src/components/command-center/SentimentHeatmap.tsx`

**Step 1: Create the component**

Create `client/src/components/command-center/SentimentHeatmap.tsx`:

```typescript
import React from 'react';
import { cn } from '../../lib/utils';

interface HeatmapData {
  platform: string;
  hours: number[]; // 24 values, one per hour, sentiment scores averaged
}

interface SentimentHeatmapProps {
  data: HeatmapData[];
}

const platformLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  SLACK: 'Slack',
  TEAMS: 'Teams',
};

function getSentimentColor(score: number): string {
  if (score >= 2) return 'bg-green-500';
  if (score >= 1) return 'bg-green-400/70';
  if (score >= 0) return 'bg-gray-500/50';
  if (score >= -1) return 'bg-orange-400/70';
  if (score >= -2) return 'bg-orange-500';
  return 'bg-red-500';
}

function getSentimentOpacity(score: number): string {
  const abs = Math.abs(score);
  if (abs >= 3) return 'opacity-100';
  if (abs >= 2) return 'opacity-80';
  if (abs >= 1) return 'opacity-60';
  return 'opacity-40';
}

export function SentimentHeatmap({ data }: SentimentHeatmapProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const displayHours = [0, 6, 12, 18, 23];

  return (
    <div className="bg-glass border border-glass-border rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">Sentiment Heatmap</h3>

      <div className="space-y-3">
        {/* Hour labels */}
        <div className="flex items-center">
          <div className="w-20" />
          <div className="flex-1 flex justify-between text-xs text-gray-400 px-1">
            {displayHours.map((h) => (
              <span key={h}>{h.toString().padStart(2, '0')}:00</span>
            ))}
          </div>
        </div>

        {/* Platform rows */}
        {data.map((row) => (
          <div key={row.platform} className="flex items-center gap-2">
            <div className="w-20 text-sm text-gray-300 truncate">
              {platformLabels[row.platform] || row.platform}
            </div>
            <div className="flex-1 flex gap-0.5">
              {row.hours.map((score, hour) => (
                <div
                  key={hour}
                  className={cn(
                    'flex-1 h-6 rounded-sm transition-all hover:scale-110 cursor-pointer',
                    getSentimentColor(score),
                    getSentimentOpacity(score)
                  )}
                  title={`${hour}:00 - Sentiment: ${score.toFixed(1)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          <span className="text-gray-400">Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-gray-500/50" />
          <span className="text-gray-400">Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          <span className="text-gray-400">Negative</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
cd client && npm run build && cd ..
```

**Step 3: Commit**

```bash
git add client/src/components/command-center/SentimentHeatmap.tsx
git commit -m "feat: add sentiment heatmap component"
```

---

### Task 3.4: Create KPI Cards Component

**Files:**
- Create: `client/src/components/command-center/KPICards.tsx`

**Step 1: Create the component**

Create `client/src/components/command-center/KPICards.tsx`:

```typescript
import React from 'react';
import { AlertCircle, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KPIData {
  critical: number;
  high: number;
  medium: number;
  resolved: number;
  criticalChange?: number;
  highChange?: number;
  mediumChange?: number;
  resolvedChange?: number;
}

interface KPICardsProps {
  data: KPIData;
}

interface CardProps {
  label: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  color: 'red' | 'orange' | 'yellow' | 'green';
}

const colorConfig = {
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-500',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    icon: 'text-orange-500',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: 'text-yellow-500',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: 'text-green-500',
  },
};

function KPICard({ label, value, change, icon: Icon, color }: CardProps) {
  const config = colorConfig[color];
  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all hover:scale-[1.02]',
      config.bg,
      config.border
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className={cn('text-sm', config.text)}>{label}</p>
        </div>
        <Icon className={cn('h-6 w-6', config.icon)} />
      </div>

      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {isPositiveChange ? (
            <>
              <TrendingUp className="h-3 w-3 text-red-400" />
              <span className="text-red-400">+{change}%</span>
            </>
          ) : isNegativeChange ? (
            <>
              <TrendingDown className="h-3 w-3 text-green-400" />
              <span className="text-green-400">{change}%</span>
            </>
          ) : (
            <span className="text-gray-400">No change</span>
          )}
          <span className="text-gray-500 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard
        label="Critical"
        value={data.critical}
        change={data.criticalChange}
        icon={AlertCircle}
        color="red"
      />
      <KPICard
        label="High"
        value={data.high}
        change={data.highChange}
        icon={AlertTriangle}
        color="orange"
      />
      <KPICard
        label="Medium"
        value={data.medium}
        change={data.mediumChange}
        icon={Clock}
        color="yellow"
      />
      <KPICard
        label="Resolved"
        value={data.resolved}
        change={data.resolvedChange}
        icon={CheckCircle}
        color="green"
      />
    </div>
  );
}
```

**Step 2: Verify build**

```bash
cd client && npm run build && cd ..
```

**Step 3: Commit**

```bash
git add client/src/components/command-center/KPICards.tsx
git commit -m "feat: add KPI cards component for command center"
```

---

### Task 3.5: Create Command Center Page

**Files:**
- Create: `client/src/pages/CommandCenter.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Create Command Center page**

Create `client/src/pages/CommandCenter.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Filter, Calendar } from 'lucide-react';
import { KPICards } from '../components/command-center/KPICards';
import { PriorityQueue } from '../components/command-center/PriorityQueue';
import { SentimentHeatmap } from '../components/command-center/SentimentHeatmap';
import { useRealtimeStore } from '../stores';

// Mock data for initial development
const mockKPIData = {
  critical: 12,
  high: 34,
  medium: 89,
  resolved: 156,
  criticalChange: 15,
  highChange: -8,
  mediumChange: 5,
  resolvedChange: 23,
};

const mockHeatmapData = [
  { platform: 'WHATSAPP', hours: Array.from({ length: 24 }, () => Math.random() * 4 - 2) },
  { platform: 'TELEGRAM', hours: Array.from({ length: 24 }, () => Math.random() * 4 - 2) },
  { platform: 'SLACK', hours: Array.from({ length: 24 }, () => Math.random() * 4 - 2) },
  { platform: 'TEAMS', hours: Array.from({ length: 24 }, () => Math.random() * 4 - 2) },
];

const mockQueueItems = [
  {
    id: '1',
    customerName: 'John Doe',
    platform: 'WHATSAPP',
    lastMessage: 'This is absolutely unacceptable! I\'ve been waiting for 3 days and still no response!',
    sentimentScore: -4.2,
    emotion: 'angry',
    severity: 'CRITICAL' as const,
    waitTimeMinutes: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    customerName: 'Sarah Miller',
    platform: 'SLACK',
    lastMessage: 'I\'m really frustrated with the service. When will someone help me?',
    sentimentScore: -2.8,
    emotion: 'frustrated',
    severity: 'HIGH' as const,
    waitTimeMinutes: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    customerName: 'Mike Thompson',
    platform: 'TEAMS',
    lastMessage: 'The product isn\'t working as expected. Can you assist?',
    sentimentScore: -1.2,
    emotion: 'worried',
    severity: 'MEDIUM' as const,
    waitTimeMinutes: 8,
    createdAt: new Date().toISOString(),
  },
];

export default function CommandCenter() {
  const { escalationQueue } = useRealtimeStore();
  const [dateRange, setDateRange] = useState('today');

  // Use real data if available, otherwise mock
  const queueItems = escalationQueue.length > 0
    ? escalationQueue.map(e => ({
        id: e.id,
        customerName: e.customerName,
        platform: e.platform,
        lastMessage: e.lastMessage,
        sentimentScore: e.sentimentScore,
        emotion: e.emotion,
        severity: e.severity,
        waitTimeMinutes: e.waitTime,
        createdAt: e.createdAt,
      }))
    : mockQueueItems;

  const handleView = (id: string) => {
    console.log('View escalation:', id);
    // TODO: Navigate to conversation
  };

  const handleAssign = (id: string) => {
    console.log('Assign escalation:', id);
    // TODO: Open assign modal
  };

  const handleEscalate = (id: string) => {
    console.log('Escalate:', id);
    // TODO: Escalate to manager
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Command Center
          </h1>
          <p className="text-gray-400 mt-1">Sentiment-aware escalation monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm">
            <Calendar className="h-4 w-4" />
            {dateRange === 'today' ? 'Today' : dateRange}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards data={mockKPIData} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Queue */}
        <PriorityQueue
          items={queueItems}
          onView={handleView}
          onAssign={handleAssign}
          onEscalate={handleEscalate}
        />

        {/* Sentiment Heatmap */}
        <SentimentHeatmap data={mockHeatmapData} />
      </div>

      {/* Live Sentiment Feed */}
      <div className="bg-glass border border-glass-border rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Live Sentiment Feed</h3>
        <div className="space-y-2 font-mono text-sm max-h-48 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors">
              <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
              <span className="text-primary">WhatsApp</span>
              <span className={i % 2 === 0 ? 'text-green-400' : 'text-red-400'}>
                {i % 2 === 0 ? '↑' : '↓'} {(Math.random() * 4 - 2).toFixed(1)}
              </span>
              <span className="text-gray-400 truncate">Customer message processed</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Update App.tsx to include CommandCenter route**

Modify `client/src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import CommandCenter from './pages/CommandCenter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="command-center" element={<CommandCenter />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="logs" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
```

**Step 3: Verify build**

```bash
cd client && npm run build && cd ..
```

**Step 4: Commit**

```bash
git add client/src/pages/CommandCenter.tsx client/src/App.tsx
git commit -m "feat: add command center page with KPIs, queue, and heatmap"
```

---

## Summary: Remaining Phases

This plan covers Phases 0-3. The remaining phases would be:

**Phase 4: Unified Inbox** (Tasks 4.1-4.6)
- ConversationList component
- MessageThread component
- ReplyBox with AI suggestions
- Inbox page

**Phase 5: Customer Profiles** (Tasks 5.1-5.4)
- CustomerList component
- CustomerProfile with unified timeline
- SentimentChart component
- GDPR tools

**Phase 6: Live Monitoring** (Tasks 6.1-6.4)
- ConversationGrid component
- WatchPanel with whisper
- Live indicators

**Phase 7: Analytics** (Tasks 7.1-7.4)
- Comprehensive charts with Recharts
- Export functionality
- Role-based views

**Phase 8: Settings & Polish** (Tasks 8.1-8.4)
- Notification preferences UI
- Theme switcher
- Sound settings
- Final integration testing

---

## Next Steps

After completing Phase 3, create a follow-up plan document for Phases 4-8 to continue the implementation.
