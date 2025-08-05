
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';
import { eq } from 'drizzle-orm';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          username: 'admin1',
          email: 'admin@test.com',
          password_hash: 'hashed_password_1',
          role: 'admin'
        },
        {
          username: 'cashier1',
          email: 'cashier@test.com',
          password_hash: 'hashed_password_2',
          role: 'cashier'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].username).toEqual('admin1');
    expect(result[0].email).toEqual('admin@test.com');
    expect(result[0].role).toEqual('admin');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].username).toEqual('cashier1');
    expect(result[1].email).toEqual('cashier@test.com');
    expect(result[1].role).toEqual('cashier');
    expect(result[1].is_active).toBe(true);
  });

  it('should include inactive users', async () => {
    // Create inactive user
    await db.insert(usersTable)
      .values({
        username: 'inactive_user',
        email: 'inactive@test.com',
        password_hash: 'hashed_password',
        role: 'cashier',
        is_active: false
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].username).toEqual('inactive_user');
    expect(result[0].is_active).toBe(false);
  });

  it('should return users ordered by creation date', async () => {
    // Create users with slight delay to ensure different timestamps
    await db.insert(usersTable)
      .values({
        username: 'first_user',
        email: 'first@test.com',
        password_hash: 'hash1',
        role: 'admin'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(usersTable)
      .values({
        username: 'second_user',
        email: 'second@test.com',
        password_hash: 'hash2',
        role: 'cashier'
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].username).toEqual('first_user');
    expect(result[1].username).toEqual('second_user');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should return complete user objects with all fields', async () => {
    await db.insert(usersTable)
      .values({
        username: 'test_user',
        email: 'test@example.com',
        password_hash: 'secure_hash',
        role: 'admin',
        is_active: true
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    // Verify all required fields are present
    expect(typeof user.id).toBe('number');
    expect(typeof user.username).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.password_hash).toBe('string');
    expect(['admin', 'cashier']).toContain(user.role);
    expect(typeof user.is_active).toBe('boolean');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });
});
