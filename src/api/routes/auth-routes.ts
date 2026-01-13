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
