
import { db } from '../db';
import { queueTable } from '../db/schema';
import { type CreateQueueInput, type Queue } from '../schema';
import { eq, max } from 'drizzle-orm';

export const createQueueNumber = async (input: CreateQueueInput): Promise<Queue> => {
  try {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format

    // Get the highest queue number for today
    const maxQueueResult = await db.select({ 
      maxNumber: max(queueTable.queue_number) 
    })
    .from(queueTable)
    .where(eq(queueTable.queue_date, todayDateString))
    .execute();

    // Calculate next queue number (start from 1 if no entries for today)
    const nextQueueNumber = (maxQueueResult[0]?.maxNumber || 0) + 1;

    // Insert new queue entry
    const result = await db.insert(queueTable)
      .values({
        queue_number: nextQueueNumber,
        customer_name: input.customer_name || null,
        status: 'waiting',
        queue_date: todayDateString
      })
      .returning()
      .execute();

    const queueEntry = result[0];
    return {
      ...queueEntry,
      queue_date: new Date(queueEntry.queue_date + 'T00:00:00Z') // Convert date string to Date object
    };
  } catch (error) {
    console.error('Queue number creation failed:', error);
    throw error;
  }
};
