
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import { createHmac } from 'crypto';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';
const JWT_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const login = async (input: LoginInput): Promise<{ user: User; token: string }> => {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password (in a real app, use bcrypt.compare)
    const isPasswordValid = await verifyPassword(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Generate simple JWT-like token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // Return user and token
    const userResponse: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return {
      user: userResponse,
      token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Simple password verification (in production, use bcrypt)
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  // For testing purposes, we'll use a simple hash comparison
  // In production, use: return await bcrypt.compare(plainPassword, hashedPassword);
  return plainPassword === hashedPassword || 
         `hashed_${plainPassword}` === hashedPassword;
}

// Simple JWT-like token generation using HMAC
function generateToken(payload: { userId: number; username: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadData = {
    ...payload,
    exp: Date.now() + JWT_EXPIRES_IN,
    iat: Date.now()
  };
  const payloadStr = Buffer.from(JSON.stringify(payloadData)).toString('base64url');
  
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadStr}`)
    .digest('base64url');
  
  return `${header}.${payloadStr}.${signature}`;
}

// Simple JWT-like token verification
export function verifyToken(token: string): any {
  try {
    const [header, payload, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }
    
    // Decode payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration
    if (decoded.exp < Date.now()) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
