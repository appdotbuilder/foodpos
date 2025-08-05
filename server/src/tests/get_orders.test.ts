
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ordersTable, queueTable, categoriesTable, productsTable } from '../db/schema';
import { getOrders } from '../handlers/get_orders';
import { type CreateUserInput } from '../schema';

// Test data
const testUser: CreateUserInput = {
  username: 'testcashier',
  email: 'cashier@test.com',
  password: 'password123',
  role: 'cashier'
};

const testCategory = {
  name: 'Test Category',
  description: 'A category for testing'
};

const testProduct = {
  name: 'Test Product',
  description: 'A product for testing',
  price: '19.99',
  category_id: 1,
  stock_quantity: 100
};

const testQueue = {
  queue_number: 1,
  customer_name: 'Test Customer',
  status: 'waiting' as const
};

describe('getOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no orders exist', async () => {
    const result = await getOrders();
    expect(result).toEqual([]);
  });

  it('should return all orders', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        ...testProduct,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const queueResult = await db.insert(queueTable)
      .values(testQueue)
      .returning()
      .execute();

    // Create two test orders
    const order1 = await db.insert(ordersTable)
      .values({
        queue_id: queueResult[0].id,
        cashier_id: userResult[0].id,
        total_amount: '29.99',
        payment_method: 'cash',
        status: 'pending',
        notes: 'First test order'
      })
      .returning()
      .execute();

    const order2 = await db.insert(ordersTable)
      .values({
        queue_id: null,
        cashier_id: userResult[0].id,
        total_amount: '45.50',
        payment_method: 'card',
        status: 'completed',
        notes: null
      })
      .returning()
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(2);
    
    // Check first order
    const firstOrder = result.find(o => o.id === order1[0].id);
    expect(firstOrder).toBeDefined();
    expect(firstOrder!.queue_id).toEqual(queueResult[0].id);
    expect(firstOrder!.cashier_id).toEqual(userResult[0].id);
    expect(firstOrder!.total_amount).toEqual(29.99);
    expect(typeof firstOrder!.total_amount).toBe('number');
    expect(firstOrder!.payment_method).toEqual('cash');
    expect(firstOrder!.status).toEqual('pending');
    expect(firstOrder!.notes).toEqual('First test order');
    expect(firstOrder!.created_at).toBeInstanceOf(Date);
    expect(firstOrder!.updated_at).toBeInstanceOf(Date);

    // Check second order
    const secondOrder = result.find(o => o.id === order2[0].id);
    expect(secondOrder).toBeDefined();
    expect(secondOrder!.queue_id).toBeNull();
    expect(secondOrder!.cashier_id).toEqual(userResult[0].id);
    expect(secondOrder!.total_amount).toEqual(45.50);
    expect(typeof secondOrder!.total_amount).toBe('number');
    expect(secondOrder!.payment_method).toEqual('card');
    expect(secondOrder!.status).toEqual('completed');
    expect(secondOrder!.notes).toBeNull();
  });

  it('should handle orders without queue or with null values', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        role: testUser.role
      })
      .returning()
      .execute();

    // Create order without queue
    await db.insert(ordersTable)
      .values({
        queue_id: null,
        cashier_id: userResult[0].id,
        total_amount: '15.99',
        payment_method: 'digital_wallet',
        status: 'ready',
        notes: null
      })
      .returning()
      .execute();

    const result = await getOrders();

    expect(result).toHaveLength(1);
    expect(result[0].queue_id).toBeNull();
    expect(result[0].cashier_id).toEqual(userResult[0].id);
    expect(result[0].total_amount).toEqual(15.99);
    expect(result[0].payment_method).toEqual('digital_wallet');
    expect(result[0].status).toEqual('ready');
    expect(result[0].notes).toBeNull();
  });
});
