
import { db } from '../db';
import { queueTable } from '../db/schema';
import { type UpdateQueueStatusInput, type Queue } from '../schema';
import { eq } from 'drizzle-orm';

export const updateQueueStatus = async (input: UpdateQueueStatusInput): Promise<Queue> => {
  try {
    // Prepare update values with timestamps based on status
    const updateValues: any = {
      status: input.status
    };

    // Set appropriate timestamps based on status
    if (input.status === 'called') {
      updateValues.called_at = new Date();
    } else if (input.status === 'served') {
      updateValues.served_at = new Date();
    }

    // Update queue record
    const result = await db.update(queueTable)
      .set(updateValues)
      .where(eq(queueTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Queue item with id ${input.id} not found`);
    }

    // Convert queue_date from string to Date for return type
    const queueItem = result[0];
    return {
      ...queueItem,
      queue_date: new Date(queueItem.queue_date)
    };
  } catch (error) {
    console.error('Queue status update failed:', error);
    throw error;
  }
};
