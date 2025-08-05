
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'cashier'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.role).toEqual('cashier');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query the database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].role).toEqual('cashier');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password correctly', async () => {
    const result = await createUser(testInput);

    // Verify password is hashed and can be verified
    const isPasswordValid = await Bun.password.verify('password123', result.password_hash);
    expect(isPasswordValid).toBe(true);

    // Verify incorrect password fails
    const isWrongPasswordValid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isWrongPasswordValid).toBe(false);
  });

  it('should create admin user', async () => {
    const adminInput: CreateUserInput = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'adminpass123',
      role: 'admin'
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('admin');
    expect(result.username).toEqual('admin');
    expect(result.email).toEqual('admin@example.com');
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create user with same username
    const duplicateInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'password456',
      role: 'admin'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow();
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create user with same email
    const duplicateInput: CreateUserInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'password456',
      role: 'admin'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow();
  });
});
