
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queueTable } from '../db/schema';
import { type CreateQueueInput } from '../schema';
import { createQueueNumber } from '../handlers/create_queue_number';
import { eq } from 'drizzle-orm';

describe('createQueueNumber', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create first queue number as 1', async () => {
    const input: CreateQueueInput = {
      customer_name: 'John Doe'
    };

    const result = await createQueueNumber(input);

    expect(result.queue_number).toEqual(1);
    expect(result.customer_name).toEqual('John Doe');
    expect(result.status).toEqual('waiting');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.called_at).toBeNull();
    expect(result.served_at).toBeNull();
    expect(result.queue_date).toBeInstanceOf(Date);
  });

  it('should create queue number without customer name', async () => {
    const input: CreateQueueInput = {};

    const result = await createQueueNumber(input);

    expect(result.queue_number).toEqual(1);
    expect(result.customer_name).toBeNull();
    expect(result.status).toEqual('waiting');
  });

  it('should auto-increment queue numbers for same day', async () => {
    const input: CreateQueueInput = {
      customer_name: 'Customer 1'
    };

    // Create first queue number
    const first = await createQueueNumber(input);
    expect(first.queue_number).toEqual(1);

    // Create second queue number
    const second = await createQueueNumber({
      customer_name: 'Customer 2'
    });
    expect(second.queue_number).toEqual(2);

    // Create third queue number
    const third = await createQueueNumber({
      customer_name: 'Customer 3'
    });
    expect(third.queue_number).toEqual(3);
  });

  it('should save queue entry to database', async () => {
    const input: CreateQueueInput = {
      customer_name: 'Test Customer'
    };

    const result = await createQueueNumber(input);

    // Verify data was saved correctly
    const queueEntries = await db.select()
      .from(queueTable)
      .where(eq(queueTable.id, result.id))
      .execute();

    expect(queueEntries).toHaveLength(1);
    const saved = queueEntries[0];
    expect(saved.queue_number).toEqual(1);
    expect(saved.customer_name).toEqual('Test Customer');
    expect(saved.status).toEqual('waiting');
    expect(saved.created_at).toBeInstanceOf(Date);
    expect(saved.queue_date).toEqual(new Date().toISOString().split('T')[0]);
  });

  it('should handle multiple queue entries correctly', async () => {
    // Create multiple queue entries
    const first = await createQueueNumber({ customer_name: 'First' });
    const second = await createQueueNumber({ customer_name: 'Second' });
    const third = await createQueueNumber({});

    // Verify all entries are in database with correct queue numbers
    const allEntries = await db.select()
      .from(queueTable)
      .orderBy(queueTable.queue_number)
      .execute();

    expect(allEntries).toHaveLength(3);
    expect(allEntries[0].queue_number).toEqual(1);
    expect(allEntries[0].customer_name).toEqual('First');
    expect(allEntries[1].queue_number).toEqual(2);
    expect(allEntries[1].customer_name).toEqual('Second');
    expect(allEntries[2].queue_number).toEqual(3);
    expect(allEntries[2].customer_name).toBeNull();

    // All should have same queue_date (today)
    const today = new Date().toISOString().split('T')[0];
    allEntries.forEach(entry => {
      expect(entry.queue_date).toEqual(today);
      expect(entry.status).toEqual('waiting');
    });
  });

  it('should handle queue date correctly', async () => {
    const result = await createQueueNumber({
      customer_name: 'Date Test'
    });

    const today = new Date();
    const resultDate = result.queue_date;

    // Check that queue_date is today
    expect(resultDate.getFullYear()).toEqual(today.getFullYear());
    expect(resultDate.getMonth()).toEqual(today.getMonth());
    expect(resultDate.getDate()).toEqual(today.getDate());
  });

  it('should maintain queue number sequence with mixed customer names', async () => {
    // Mix of entries with and without customer names
    const entries = [
      { customer_name: 'Alice' },
      {},
      { customer_name: 'Bob' },
      {},
      { customer_name: 'Charlie' }
    ];

    const results = [];
    for (const entry of entries) {
      results.push(await createQueueNumber(entry));
    }

    // Verify sequential numbering
    results.forEach((result, index) => {
      expect(result.queue_number).toEqual(index + 1);
    });

    // Verify customer names are correctly set
    expect(results[0].customer_name).toEqual('Alice');
    expect(results[1].customer_name).toBeNull();
    expect(results[2].customer_name).toEqual('Bob');
    expect(results[3].customer_name).toBeNull();
    expect(results[4].customer_name).toEqual('Charlie');
  });
});
