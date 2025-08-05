
import { db } from '../db';
import { queueTable } from '../db/schema';
import { type Queue } from '../schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function getCurrentQueueNumber(): Promise<Queue | null> {
  try {
    // First, check if there's a currently called queue number
    const calledQueue = await db.select()
      .from(queueTable)
      .where(eq(queueTable.status, 'called'))
      .orderBy(desc(queueTable.queue_number))
      .limit(1)
      .execute();

    if (calledQueue.length > 0) {
      const queue = calledQueue[0];
      return {
        ...queue,
        queue_date: new Date(queue.queue_date)
      };
    }

    // If no called queue, get the next waiting queue number
    const waitingQueue = await db.select()
      .from(queueTable)
      .where(eq(queueTable.status, 'waiting'))
      .orderBy(asc(queueTable.queue_number))
      .limit(1)
      .execute();

    if (waitingQueue.length > 0) {
      const queue = waitingQueue[0];
      return {
        ...queue,
        queue_date: new Date(queue.queue_date)
      };
    }

    // No queue numbers found
    return null;
  } catch (error) {
    console.error('Failed to get current queue number:', error);
    throw error;
  }
}
