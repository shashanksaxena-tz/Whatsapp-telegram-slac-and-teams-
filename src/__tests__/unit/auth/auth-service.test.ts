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
