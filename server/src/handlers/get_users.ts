
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const result = await db.select()
      .from(usersTable)
      .execute();

    return result.map(user => ({
      ...user,
      // No numeric conversions needed for users table
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
