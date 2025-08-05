
import { db } from '../db';
import { queueTable } from '../db/schema';
import { type Queue } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getQueue(): Promise<Queue[]> {
  try {
    // Get today's date for filtering
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Query today's queue ordered by queue number
    const results = await db.select()
      .from(queueTable)
      .where(eq(queueTable.queue_date, todayString))
      .orderBy(asc(queueTable.queue_number))
      .execute();

    // Convert queue_date string to Date object
    return results.map(result => ({
      ...result,
      queue_date: new Date(result.queue_date)
    }));
  } catch (error) {
    console.error('Get queue failed:', error);
    throw error;
  }
}
