
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queueTable } from '../db/schema';
import { type UpdateQueueStatusInput, type CreateQueueInput } from '../schema';
import { updateQueueStatus } from '../handlers/update_queue_status';
import { eq } from 'drizzle-orm';

describe('updateQueueStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestQueue = async (customerName?: string) => {
    const result = await db.insert(queueTable)
      .values({
        queue_number: 1,
        customer_name: customerName || null,
        status: 'waiting'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update queue status to called', async () => {
    const testQueue = await createTestQueue('John Doe');
    
    const input: UpdateQueueStatusInput = {
      id: testQueue.id,
      status: 'called'
    };

    const result = await updateQueueStatus(input);

    expect(result.id).toEqual(testQueue.id);
    expect(result.status).toEqual('called');
    expect(result.called_at).toBeInstanceOf(Date);
    expect(result.served_at).toBeNull();
    expect(result.customer_name).toEqual('John Doe');
    expect(result.queue_date).toBeInstanceOf(Date);
  });

  it('should update queue status to served', async () => {
    const testQueue = await createTestQueue();
    
    const input: UpdateQueueStatusInput = {
      id: testQueue.id,
      status: 'served'
    };

    const result = await updateQueueStatus(input);

    expect(result.id).toEqual(testQueue.id);
    expect(result.status).toEqual('served');
    expect(result.served_at).toBeInstanceOf(Date);
    expect(result.called_at).toBeNull();
    expect(result.queue_date).toBeInstanceOf(Date);
  });

  it('should update queue status to cancelled without timestamps', async () => {
    const testQueue = await createTestQueue('Jane Smith');
    
    const input: UpdateQueueStatusInput = {
      id: testQueue.id,
      status: 'cancelled'
    };

    const result = await updateQueueStatus(input);

    expect(result.id).toEqual(testQueue.id);
    expect(result.status).toEqual('cancelled');
    expect(result.called_at).toBeNull();
    expect(result.served_at).toBeNull();
    expect(result.customer_name).toEqual('Jane Smith');
    expect(result.queue_date).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    const testQueue = await createTestQueue();
    
    const input: UpdateQueueStatusInput = {
      id: testQueue.id,
      status: 'called'
    };

    await updateQueueStatus(input);

    const updatedQueue = await db.select()
      .from(queueTable)
      .where(eq(queueTable.id, testQueue.id))
      .execute();

    expect(updatedQueue).toHaveLength(1);
    expect(updatedQueue[0].status).toEqual('called');
    expect(updatedQueue[0].called_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent queue id', async () => {
    const input: UpdateQueueStatusInput = {
      id: 99999,
      status: 'called'
    };

    await expect(updateQueueStatus(input)).rejects.toThrow(/Queue item with id 99999 not found/i);
  });

  it('should preserve existing timestamps when updating to different status', async () => {
    const testQueue = await createTestQueue();
    
    // First, update to called status
    await updateQueueStatus({
      id: testQueue.id,
      status: 'called'
    });

    // Then update to served status
    const result = await updateQueueStatus({
      id: testQueue.id,
      status: 'served'
    });

    expect(result.status).toEqual('served');
    expect(result.called_at).toBeInstanceOf(Date);
    expect(result.served_at).toBeInstanceOf(Date);
    expect(result.queue_date).toBeInstanceOf(Date);
  });
});
