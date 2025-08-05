
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login, verifyToken } from '../handlers/login';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password123',
  role: 'cashier' as const,
  is_active: true
};

const validLoginInput: LoginInput = {
  username: 'testuser',
  password: 'password123'
};

describe('login', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password123' // Simple hash for testing
      })
      .execute();
  });

  afterEach(resetDB);

  it('should login successfully with valid credentials', async () => {
    const result = await login(validLoginInput);

    // Verify user data
    expect(result.user.username).toEqual('testuser');
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.role).toEqual('cashier');
    expect(result.user.is_active).toEqual(true);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Verify token
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');

    // Verify token is valid
    const decoded = verifyToken(result.token);
    expect(decoded.userId).toEqual(result.user.id);
    expect(decoded.username).toEqual('testuser');
    expect(decoded.role).toEqual('cashier');
    expect(decoded.exp).toBeGreaterThan(Date.now());
    expect(decoded.iat).toBeLessThanOrEqual(Date.now());
  });

  it('should fail with invalid username', async () => {
    const invalidInput: LoginInput = {
      username: 'nonexistent',
      password: 'password123'
    };

    expect(login(invalidInput)).rejects.toThrow(/invalid username or password/i);
  });

  it('should fail with invalid password', async () => {
    const invalidInput: LoginInput = {
      username: 'testuser',
      password: 'wrongpassword'
    };

    expect(login(invalidInput)).rejects.toThrow(/invalid username or password/i);
  });

  it('should fail for deactivated user', async () => {
    // Create deactivated user
    await db.insert(usersTable)
      .values({
        username: 'deactivated',
        email: 'deactivated@example.com',
        password_hash: 'hashed_password123',
        role: 'cashier',
        is_active: false
      })
      .execute();

    const deactivatedInput: LoginInput = {
      username: 'deactivated',
      password: 'password123'
    };

    expect(login(deactivatedInput)).rejects.toThrow(/account is deactivated/i);
  });

  it('should work with admin role', async () => {
    // Create admin user
    await db.insert(usersTable)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'hashed_adminpass',
        role: 'admin',
        is_active: true
      })
      .execute();

    const adminInput: LoginInput = {
      username: 'admin',
      password: 'adminpass'
    };

    const result = await login(adminInput);

    expect(result.user.role).toEqual('admin');
    expect(result.user.username).toEqual('admin');

    // Verify token contains admin role
    const decoded = verifyToken(result.token);
    expect(decoded.role).toEqual('admin');
  });

  it('should handle alternative password hashing format', async () => {
    // Test with different hash format
    await db.insert(usersTable)
      .values({
        username: 'altuser',
        email: 'alt@example.com',
        password_hash: 'mypassword', // Direct password for testing
        role: 'cashier',
        is_active: true
      })
      .execute();

    const altInput: LoginInput = {
      username: 'altuser',
      password: 'mypassword'
    };

    const result = await login(altInput);

    expect(result.user.username).toEqual('altuser');
    expect(result.token).toBeDefined();
  });

  it('should generate valid token format', async () => {
    const result = await login(validLoginInput);
    
    // Token should have 3 parts separated by dots (header.payload.signature)
    const tokenParts = result.token.split('.');
    expect(tokenParts).toHaveLength(3);
    
    // Each part should be base64url encoded
    tokenParts.forEach(part => {
      expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  it('should reject invalid token', async () => {
    expect(() => verifyToken('invalid.token')).toThrow(/invalid token/i);
    expect(() => verifyToken('invalid.token.signature')).toThrow(/invalid token/i);
  });
});
