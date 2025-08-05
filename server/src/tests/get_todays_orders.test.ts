
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ordersTable } from '../db/schema';
import { getTodaysOrders } from '../handlers/get_todays_orders';

describe('getTodaysOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no orders exist', async () => {
    const result = await getTodaysOrders();
    expect(result).toEqual([]);
  });

  it('should return orders created today', async () => {
    // Create a cashier user first
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = cashierResult[0].id;

    // Create an order today
    const orderResult = await db.insert(ordersTable)
      .values({
        cashier_id: cashierId,
        total_amount: '25.99',
        payment_method: 'cash',
        status: 'completed'
      })
      .returning()
      .execute();

    const result = await getTodaysOrders();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(orderResult[0].id);
    expect(result[0].total_amount).toEqual(25.99);
    expect(typeof result[0].total_amount).toBe('number');
    expect(result[0].payment_method).toEqual('cash');
    expect(result[0].status).toEqual('completed');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should not return orders from yesterday', async () => {
    // Create a cashier user first
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = cashierResult[0].id;

    // Create an order from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 30, 0, 0);

    await db.insert(ordersTable)
      .values({
        cashier_id: cashierId,
        total_amount: '15.99',
        payment_method: 'card',
        status: 'completed',
        created_at: yesterday
      })
      .execute();

    const result = await getTodaysOrders();

    expect(result).toHaveLength(0);
  });

  it('should return multiple orders from today', async () => {
    // Create a cashier user first
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = cashierResult[0].id;

    // Create multiple orders today
    await db.insert(ordersTable)
      .values([
        {
          cashier_id: cashierId,
          total_amount: '12.50',
          payment_method: 'cash',
          status: 'completed'
        },
        {
          cashier_id: cashierId,
          total_amount: '33.75',
          payment_method: 'card',
          status: 'pending'
        }
      ])
      .execute();

    const result = await getTodaysOrders();

    expect(result).toHaveLength(2);
    
    // Check first order
    const cashOrder = result.find(order => order.payment_method === 'cash');
    expect(cashOrder).toBeDefined();
    expect(cashOrder!.total_amount).toEqual(12.50);
    expect(typeof cashOrder!.total_amount).toBe('number');

    // Check second order
    const cardOrder = result.find(order => order.payment_method === 'card');
    expect(cardOrder).toBeDefined();
    expect(cardOrder!.total_amount).toEqual(33.75);
    expect(typeof cardOrder!.total_amount).toBe('number');
  });
});
