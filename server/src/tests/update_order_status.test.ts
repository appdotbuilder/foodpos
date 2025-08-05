
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, usersTable, categoriesTable, productsTable } from '../db/schema';
import { type UpdateOrderStatusInput } from '../schema';
import { updateOrderStatus } from '../handlers/update_order_status';
import { eq } from 'drizzle-orm';

describe('updateOrderStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update order status', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'cashier1',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Beverages',
        description: 'Hot and cold drinks'
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Coffee',
        description: 'Hot coffee',
        price: '5.99',
        category_id: categoryResult[0].id,
        stock_quantity: 50
      })
      .returning()
      .execute();

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        cashier_id: userResult[0].id,
        total_amount: '25.99',
        payment_method: 'cash',
        status: 'pending'
      })
      .returning()
      .execute();

    const testInput: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'preparing'
    };

    const result = await updateOrderStatus(testInput);

    // Verify returned data
    expect(result.id).toEqual(orderResult[0].id);
    expect(result.status).toEqual('preparing');
    expect(result.total_amount).toEqual(25.99);
    expect(typeof result.total_amount).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(orderResult[0].updated_at.getTime());
  });

  it('should save updated status to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'cashier2',
        email: 'cashier2@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Food',
        description: 'Various food items'
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Sandwich',
        description: 'Grilled sandwich',
        price: '8.50',
        category_id: categoryResult[0].id,
        stock_quantity: 25
      })
      .returning()
      .execute();

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        cashier_id: userResult[0].id,
        total_amount: '15.75',
        payment_method: 'card',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();

    const testInput: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'completed'
    };

    const originalUpdatedAt = orderResult[0].updated_at;
    await updateOrderStatus(testInput);

    // Query database to verify update
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderResult[0].id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toEqual('completed');
    expect(orders[0].updated_at).toBeInstanceOf(Date);
    expect(orders[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(orders[0].notes).toEqual('Test order'); // Other fields unchanged
  });

  it('should throw error for non-existent order', async () => {
    const testInput: UpdateOrderStatusInput = {
      id: 99999,
      status: 'ready'
    };

    await expect(updateOrderStatus(testInput)).rejects.toThrow(/order with id 99999 not found/i);
  });

  it('should update order to cancelled status', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'admin1',
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Snacks',
        description: 'Light snacks'
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Chips',
        description: 'Potato chips',
        price: '3.25',
        category_id: categoryResult[0].id,
        stock_quantity: 100
      })
      .returning()
      .execute();

    // Create test order with preparing status
    const orderResult = await db.insert(ordersTable)
      .values({
        cashier_id: userResult[0].id,
        total_amount: '6.50',
        payment_method: 'digital_wallet',
        status: 'preparing'
      })
      .returning()
      .execute();

    const testInput: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'cancelled'
    };

    const result = await updateOrderStatus(testInput);

    expect(result.status).toEqual('cancelled');
    expect(result.payment_method).toEqual('digital_wallet');
    expect(result.total_amount).toEqual(6.50);
  });
});
