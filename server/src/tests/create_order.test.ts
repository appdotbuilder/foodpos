
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable, orderItemsTable, queueTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let cashierId: number;
  let categoryId: number;
  let productId1: number;
  let productId2: number;
  let queueId: number;

  beforeEach(async () => {
    // Create test cashier
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();
    cashierId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category for orders'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Test Product 1',
        description: 'First test product',
        price: '10.50',
        category_id: categoryId,
        stock_quantity: 100
      })
      .returning()
      .execute();
    productId1 = product1Result[0].id;

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Test Product 2',
        description: 'Second test product',
        price: '25.00',
        category_id: categoryId,
        stock_quantity: 50
      })
      .returning()
      .execute();
    productId2 = product2Result[0].id;

    // Create test queue entry
    const queueResult = await db.insert(queueTable)
      .values({
        queue_number: 1,
        customer_name: 'Test Customer',
        status: 'waiting'
      })
      .returning()
      .execute();
    queueId = queueResult[0].id;
  });

  it('should create an order with single item', async () => {
    const testInput: CreateOrderInput = {
      queue_id: queueId,
      payment_method: 'cash',
      notes: 'Test order',
      items: [
        {
          product_id: productId1,
          quantity: 2
        }
      ]
    };

    const result = await createOrder(testInput, cashierId);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.queue_id).toEqual(queueId);
    expect(result.cashier_id).toEqual(cashierId);
    expect(result.total_amount).toEqual(21.00); // 10.50 * 2
    expect(result.payment_method).toEqual('cash');
    expect(result.status).toEqual('pending');
    expect(result.notes).toEqual('Test order');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an order with multiple items', async () => {
    const testInput: CreateOrderInput = {
      payment_method: 'card',
      items: [
        {
          product_id: productId1,
          quantity: 3
        },
        {
          product_id: productId2,
          quantity: 1
        }
      ]
    };

    const result = await createOrder(testInput, cashierId);

    // Verify total calculation: (10.50 * 3) + (25.00 * 1) = 56.50
    expect(result.total_amount).toEqual(56.50);
    expect(result.queue_id).toBeNull();
    expect(result.payment_method).toEqual('card');
    expect(result.notes).toBeNull();
  });

  it('should save order and order items to database', async () => {
    const testInput: CreateOrderInput = {
      payment_method: 'digital_wallet',
      items: [
        {
          product_id: productId1,
          quantity: 1
        }
      ]
    };

    const result = await createOrder(testInput, cashierId);

    // Verify order in database
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].cashier_id).toEqual(cashierId);
    expect(parseFloat(orders[0].total_amount)).toEqual(10.50);

    // Verify order items in database
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, result.id))
      .execute();

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].product_id).toEqual(productId1);
    expect(orderItems[0].quantity).toEqual(1);
    expect(parseFloat(orderItems[0].unit_price)).toEqual(10.50);
    expect(parseFloat(orderItems[0].total_price)).toEqual(10.50);
  });

  it('should update product stock quantities', async () => {
    const testInput: CreateOrderInput = {
      payment_method: 'cash',
      items: [
        {
          product_id: productId1,
          quantity: 5
        },
        {
          product_id: productId2,
          quantity: 3
        }
      ]
    };

    await createOrder(testInput, cashierId);

    // Check updated stock quantities
    const product1 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId1))
      .execute();
    expect(product1[0].stock_quantity).toEqual(95); // 100 - 5

    const product2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId2))
      .execute();
    expect(product2[0].stock_quantity).toEqual(47); // 50 - 3
  });

  it('should throw error for non-existent product', async () => {
    const testInput: CreateOrderInput = {
      payment_method: 'cash',
      items: [
        {
          product_id: 99999, // Non-existent product
          quantity: 1
        }
      ]
    };

    await expect(createOrder(testInput, cashierId)).rejects.toThrow(/Product with id 99999 not found/i);
  });

  it('should throw error for insufficient stock', async () => {
    const testInput: CreateOrderInput = {
      payment_method: 'cash',
      items: [
        {
          product_id: productId1,
          quantity: 150 // More than available stock (100)
        }
      ]
    };

    await expect(createOrder(testInput, cashierId)).rejects.toThrow(/Insufficient stock/i);
  });

  it('should throw error for inactive product', async () => {
    // Create inactive product
    const inactiveProductResult = await db.insert(productsTable)
      .values({
        name: 'Inactive Product',
        price: '5.00',
        category_id: categoryId,
        stock_quantity: 10,
        is_active: false
      })
      .returning()
      .execute();

    const testInput: CreateOrderInput = {
      payment_method: 'cash',
      items: [
        {
          product_id: inactiveProductResult[0].id,
          quantity: 1
        }
      ]
    };

    await expect(createOrder(testInput, cashierId)).rejects.toThrow(/is not active/i);
  });

  it('should handle order without queue_id', async () => {
    const testInput: CreateOrderInput = {
      payment_method: 'card',
      items: [
        {
          product_id: productId1,
          quantity: 1
        }
      ]
    };

    const result = await createOrder(testInput, cashierId);

    expect(result.queue_id).toBeNull();
    expect(result.total_amount).toEqual(10.50);
  });
});
