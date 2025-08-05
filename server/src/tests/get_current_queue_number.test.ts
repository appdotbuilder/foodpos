
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queueTable } from '../db/schema';
import { getCurrentQueueNumber } from '../handlers/get_current_queue_number';

describe('getCurrentQueueNumber', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no queue entries exist', async () => {
    const result = await getCurrentQueueNumber();
    expect(result).toBeNull();
  });

  it('should return the called queue number when one exists', async () => {
    // Create multiple queue entries
    await db.insert(queueTable).values([
      { queue_number: 1, status: 'waiting' },
      { queue_number: 2, status: 'called', customer_name: 'John' },
      { queue_number: 3, status: 'waiting' }
    ]).execute();

    const result = await getCurrentQueueNumber();

    expect(result).not.toBeNull();
    expect(result!.queue_number).toBe(2);
    expect(result!.status).toBe('called');
    expect(result!.customer_name).toBe('John');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.queue_date).toBeInstanceOf(Date);
  });

  it('should return the highest called queue number when multiple are called', async () => {
    // Create multiple called queue entries
    await db.insert(queueTable).values([
      { queue_number: 1, status: 'called' },
      { queue_number: 3, status: 'called' },
      { queue_number: 2, status: 'called' },
      { queue_number: 4, status: 'waiting' }
    ]).execute();

    const result = await getCurrentQueueNumber();

    expect(result).not.toBeNull();
    expect(result!.queue_number).toBe(3);
    expect(result!.status).toBe('called');
  });

  it('should return the next waiting queue number when no called queue exists', async () => {
    // Create multiple waiting queue entries
    await db.insert(queueTable).values([
      { queue_number: 5, status: 'waiting', customer_name: 'Alice' },
      { queue_number: 2, status: 'served' },
      { queue_number: 3, status: 'waiting' },
      { queue_number: 1, status: 'served' }
    ]).execute();

    const result = await getCurrentQueueNumber();

    expect(result).not.toBeNull();
    expect(result!.queue_number).toBe(3);
    expect(result!.status).toBe('waiting');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should prioritize called queue over waiting queue', async () => {
    // Create both called and waiting entries
    await db.insert(queueTable).values([
      { queue_number: 1, status: 'waiting' },
      { queue_number: 2, status: 'called', customer_name: 'Priority' },
      { queue_number: 3, status: 'waiting' }
    ]).execute();

    const result = await getCurrentQueueNumber();

    expect(result).not.toBeNull();
    expect(result!.queue_number).toBe(2);
    expect(result!.status).toBe('called');
    expect(result!.customer_name).toBe('Priority');
  });

  it('should return null when only served or cancelled queues exist', async () => {
    // Create only non-active queue entries
    await db.insert(queueTable).values([
      { queue_number: 1, status: 'served' },
      { queue_number: 2, status: 'cancelled' },
      { queue_number: 3, status: 'served' }
    ]).execute();

    const result = await getCurrentQueueNumber();

    expect(result).toBeNull();
  });
});
