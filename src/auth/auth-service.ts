import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  role: UserRole | string;
}

export class AuthService {
  private jwtSecret: string;
  private tokenExpiry: string | number;

  constructor(jwtSecret: string, tokenExpiry: string | number = '24h') {
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
    const options: SignOptions = { expiresIn: this.tokenExpiry as jwt.SignOptions['expiresIn'] };
    return jwt.sign(payload, this.jwtSecret, options);
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
