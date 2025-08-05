
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { queueTable } from '../db/schema';
import { getQueue } from '../handlers/get_queue';

describe('getQueue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no queue entries exist', async () => {
    const result = await getQueue();
    expect(result).toEqual([]);
  });

  it('should return today\'s queue entries ordered by queue number', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Create test queue entries for today
    await db.insert(queueTable)
      .values([
        {
          queue_number: 3,
          customer_name: 'Customer C',
          status: 'waiting',
          queue_date: today
        },
        {
          queue_number: 1,
          customer_name: 'Customer A',
          status: 'called',
          queue_date: today
        },
        {
          queue_number: 2,
          customer_name: 'Customer B',
          status: 'served',
          queue_date: today
        }
      ])
      .execute();

    const result = await getQueue();

    expect(result).toHaveLength(3);
    
    // Verify ordering by queue number
    expect(result[0].queue_number).toBe(1);
    expect(result[0].customer_name).toBe('Customer A');
    expect(result[0].status).toBe('called');
    
    expect(result[1].queue_number).toBe(2);
    expect(result[1].customer_name).toBe('Customer B');
    expect(result[1].status).toBe('served');
    
    expect(result[2].queue_number).toBe(3);
    expect(result[2].customer_name).toBe('Customer C');
    expect(result[2].status).toBe('waiting');

    // Verify all entries have today's date
    result.forEach(entry => {
      expect(entry.queue_date).toBeInstanceOf(Date);
      expect(entry.created_at).toBeInstanceOf(Date);
    });
  });

  it('should only return today\'s queue entries, not previous days', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Create entries for today and yesterday
    await db.insert(queueTable)
      .values([
        {
          queue_number: 1,
          customer_name: 'Today Customer',
          status: 'waiting',
          queue_date: today
        },
        {
          queue_number: 1,
          customer_name: 'Yesterday Customer',
          status: 'served',
          queue_date: yesterdayString
        }
      ])
      .execute();

    const result = await getQueue();

    expect(result).toHaveLength(1);
    expect(result[0].customer_name).toBe('Today Customer');
    expect(result[0].queue_date).toBeInstanceOf(Date);
  });

  it('should return all queue statuses', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Create entries with different statuses
    await db.insert(queueTable)
      .values([
        {
          queue_number: 1,
          customer_name: 'Waiting Customer',
          status: 'waiting',
          queue_date: today
        },
        {
          queue_number: 2,
          customer_name: 'Called Customer',
          status: 'called',
          queue_date: today
        },
        {
          queue_number: 3,
          customer_name: 'Served Customer',
          status: 'served',
          queue_date: today
        },
        {
          queue_number: 4,
          customer_name: 'Cancelled Customer',
          status: 'cancelled',
          queue_date: today
        }
      ])
      .execute();

    const result = await getQueue();

    expect(result).toHaveLength(4);
    expect(result.map(q => q.status)).toEqual(['waiting', 'called', 'served', 'cancelled']);
    expect(result.map(q => q.queue_number)).toEqual([1, 2, 3, 4]);
  });
});
