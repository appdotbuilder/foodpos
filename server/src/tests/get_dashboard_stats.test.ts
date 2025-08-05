
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable, queueTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dashboard stats with all zeros when no data exists', async () => {
    const result = await getDashboardStats();

    expect(result.today_orders).toEqual(0);
    expect(result.today_revenue).toEqual(0);
    expect(result.queue_length).toEqual(0);
    expect(result.active_products).toEqual(0);
    expect(result.low_stock_products).toEqual(0);
  });

  it('should count today\'s orders and revenue correctly', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashed',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create orders for today
    await db.insert(ordersTable)
      .values([
        {
          cashier_id: user[0].id,
          total_amount: '25.50',
          payment_method: 'cash',
          status: 'completed'
        },
        {
          cashier_id: user[0].id,
          total_amount: '15.25',
          payment_method: 'card',
          status: 'pending'
        }
      ])
      .execute();

    const result = await getDashboardStats();

    expect(result.today_orders).toEqual(2);
    expect(result.today_revenue).toEqual(40.75);
  });

  it('should count queue length correctly', async () => {
    // Create queue entries for today
    await db.insert(queueTable)
      .values([
        {
          queue_number: 1,
          customer_name: 'Customer 1',
          status: 'waiting'
        },
        {
          queue_number: 2,
          customer_name: 'Customer 2',
          status: 'called'
        },
        {
          queue_number: 3,
          customer_name: 'Customer 3',
          status: 'served'
        }
      ])
      .execute();

    const result = await getDashboardStats();

    expect(result.queue_length).toEqual(2); // Only waiting and called
  });

  it('should count active products correctly', async () => {
    // Create test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category'
      })
      .returning()
      .execute();

    // Create products with different active states
    await db.insert(productsTable)
      .values([
        {
          name: 'Active Product 1',
          price: '10.00',
          category_id: category[0].id,
          stock_quantity: 100,
          is_active: true
        },
        {
          name: 'Active Product 2',
          price: '15.00',
          category_id: category[0].id,
          stock_quantity: 50,
          is_active: true
        },
        {
          name: 'Inactive Product',
          price: '20.00',
          category_id: category[0].id,
          stock_quantity: 25,
          is_active: false
        }
      ])
      .execute();

    const result = await getDashboardStats();

    expect(result.active_products).toEqual(2);
  });

  it('should count low stock products correctly', async () => {
    // Create test category
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category'
      })
      .returning()
      .execute();

    // Create products with different stock levels
    await db.insert(productsTable)
      .values([
        {
          name: 'Low Stock Product 1',
          price: '10.00',
          category_id: category[0].id,
          stock_quantity: 5,
          is_active: true
        },
        {
          name: 'Low Stock Product 2',
          price: '15.00',
          category_id: category[0].id,
          stock_quantity: 10,
          is_active: true
        },
        {
          name: 'Normal Stock Product',
          price: '20.00',
          category_id: category[0].id,
          stock_quantity: 50,
          is_active: true
        },
        {
          name: 'Inactive Low Stock',
          price: '25.00',
          category_id: category[0].id,
          stock_quantity: 3,
          is_active: false
        }
      ])
      .execute();

    const result = await getDashboardStats();

    expect(result.low_stock_products).toEqual(2); // Only active products with stock <= 10
  });

  it('should return comprehensive dashboard stats', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashed',
        role: 'cashier'
      })
      .returning()
      .execute();

    // Create test category
    const category = await db.insert(categoriesTable)  
      .values({
        name: 'Test Category',
        description: 'Test category'
      })
      .returning()
      .execute();

    // Create orders, queue entries, and products
    await db.insert(ordersTable)
      .values({
        cashier_id: user[0].id,
        total_amount: '50.00',
        payment_method: 'cash',
        status: 'completed'
      })
      .execute();

    await db.insert(queueTable)
      .values({
        queue_number: 1,
        customer_name: 'Test Customer',
        status: 'waiting'
      })
      .execute();

    await db.insert(productsTable)
      .values([
        {
          name: 'Normal Product',
          price: '10.00',
          category_id: category[0].id,
          stock_quantity: 100,
          is_active: true
        },
        {
          name: 'Low Stock Product',
          price: '15.00',
          category_id: category[0].id,
          stock_quantity: 5,
          is_active: true
        }
      ])
      .execute();

    const result = await getDashboardStats();

    expect(result.today_orders).toEqual(1);
    expect(result.today_revenue).toEqual(50.00);
    expect(result.queue_length).toEqual(1);
    expect(result.active_products).toEqual(2);
    expect(result.low_stock_products).toEqual(1);
  });
});
