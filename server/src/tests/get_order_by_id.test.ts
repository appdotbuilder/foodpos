
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { getOrderById } from '../handlers/get_order_by_id';

describe('getOrderById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return order with items when found', async () => {
    // Create prerequisite data
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test description'
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values([
        {
          name: 'Product 1',
          description: 'Test product 1',
          price: '10.99',
          category_id: categoryResult[0].id,
          stock_quantity: 100
        },
        {
          name: 'Product 2',
          description: 'Test product 2',
          price: '5.50',
          category_id: categoryResult[0].id,
          stock_quantity: 50
        }
      ])
      .returning()
      .execute();

    // Create order
    const orderResult = await db.insert(ordersTable)
      .values({
        cashier_id: cashierResult[0].id,
        total_amount: '38.47',
        payment_method: 'cash',
        status: 'completed',
        notes: 'Test order'
      })
      .returning()
      .execute();

    // Create order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: orderResult[0].id,
          product_id: productResult[0].id,
          quantity: 2,
          unit_price: '10.99',
          total_price: '21.98'
        },
        {
          order_id: orderResult[0].id,
          product_id: productResult[1].id,
          quantity: 3,
          unit_price: '5.50',
          total_price: '16.50'
        }
      ])
      .execute();

    const result = await getOrderById(orderResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.order.id).toEqual(orderResult[0].id);
    expect(result!.order.cashier_id).toEqual(cashierResult[0].id);
    expect(result!.order.total_amount).toEqual(38.47);
    expect(typeof result!.order.total_amount).toBe('number');
    expect(result!.order.payment_method).toEqual('cash');
    expect(result!.order.status).toEqual('completed');
    expect(result!.order.notes).toEqual('Test order');
    expect(result!.order.created_at).toBeInstanceOf(Date);
    expect(result!.order.updated_at).toBeInstanceOf(Date);

    expect(result!.items).toHaveLength(2);
    
    const item1 = result!.items.find(item => item.product_id === productResult[0].id);
    expect(item1).toBeDefined();
    expect(item1!.quantity).toEqual(2);
    expect(item1!.unit_price).toEqual(10.99);
    expect(typeof item1!.unit_price).toBe('number');
    expect(item1!.total_price).toEqual(21.98);
    expect(typeof item1!.total_price).toBe('number');

    const item2 = result!.items.find(item => item.product_id === productResult[1].id);
    expect(item2).toBeDefined();
    expect(item2!.quantity).toEqual(3);
    expect(item2!.unit_price).toEqual(5.50);
    expect(item2!.total_price).toEqual(16.50);
  });

  it('should return null when order not found', async () => {
    const result = await getOrderById(999);
    expect(result).toBeNull();
  });

  it('should return order with empty items array when no items exist', async () => {
    // Create prerequisite data
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create order without items
    const orderResult = await db.insert(ordersTable)
      .values({
        cashier_id: cashierResult[0].id,
        total_amount: '0.00',
        payment_method: 'cash',
        status: 'pending'
      })
      .returning()
      .execute();

    const result = await getOrderById(orderResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.order.id).toEqual(orderResult[0].id);
    expect(result!.order.total_amount).toEqual(0.00);
    expect(result!.items).toHaveLength(0);
  });
});
