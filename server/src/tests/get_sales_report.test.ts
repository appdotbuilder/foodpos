
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ordersTable } from '../db/schema';
import { type SalesReportInput } from '../schema';
import { getSalesReport } from '../handlers/get_sales_report';

describe('getSalesReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty report for date range with no orders', async () => {
    const input: SalesReportInput = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'day'
    };

    const result = await getSalesReport(input);
    expect(result).toEqual([]);
  });

  it('should generate daily sales report', async () => {
    // Create a test cashier user
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'test_cashier',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = cashierResult[0].id;

    // Create test orders on specific dates
    const testDate1 = new Date('2024-01-15T10:00:00Z');
    const testDate2 = new Date('2024-01-16T14:30:00Z');

    await db.insert(ordersTable)
      .values([
        {
          cashier_id: cashierId,
          total_amount: '25.50',
          payment_method: 'cash',
          status: 'completed',
          created_at: testDate1
        },
        {
          cashier_id: cashierId,
          total_amount: '18.75',
          payment_method: 'card',
          status: 'completed',
          created_at: testDate1
        },
        {
          cashier_id: cashierId,
          total_amount: '32.00',
          payment_method: 'digital_wallet',
          status: 'completed',
          created_at: testDate2
        },
        {
          cashier_id: cashierId,
          total_amount: '15.00',
          payment_method: 'cash',
          status: 'pending', // Should be excluded from report
          created_at: testDate1
        }
      ])
      .execute();

    const input: SalesReportInput = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'day'
    };

    const result = await getSalesReport(input);

    expect(result).toHaveLength(2);
    
    // Check first day (2024-01-15)
    const day1Report = result.find(r => r.period === '2024-01-15');
    expect(day1Report).toBeDefined();
    expect(day1Report!.total_orders).toBe(2);
    expect(day1Report!.total_revenue).toBe(44.25); // 25.50 + 18.75
    expect(day1Report!.average_order_value).toBe(22.125); // 44.25 / 2

    // Check second day (2024-01-16)
    const day2Report = result.find(r => r.period === '2024-01-16');
    expect(day2Report).toBeDefined();
    expect(day2Report!.total_orders).toBe(1);
    expect(day2Report!.total_revenue).toBe(32.00);
    expect(day2Report!.average_order_value).toBe(32.00);
  });

  it('should generate weekly sales report', async () => {
    // Create a test cashier user
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'test_cashier',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = cashierResult[0].id;

    // Create orders in different weeks
    await db.insert(ordersTable)
      .values([
        {
          cashier_id: cashierId,
          total_amount: '100.00',
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date('2024-01-15T10:00:00Z') // Week 3 of 2024
        },
        {
          cashier_id: cashierId,
          total_amount: '150.00',
          payment_method: 'card',
          status: 'completed',
          created_at: new Date('2024-01-22T10:00:00Z') // Week 4 of 2024
        }
      ])
      .execute();

    const input: SalesReportInput = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'week'
    };

    const result = await getSalesReport(input);

    expect(result).toHaveLength(2);
    expect(result[0].period).toMatch(/2024-W0[34]/); // Week 03 or 04
    expect(result[1].period).toMatch(/2024-W0[34]/); // Week 03 or 04
    
    // Verify totals across both weeks
    const totalRevenue = result.reduce((sum, report) => sum + report.total_revenue, 0);
    const totalOrders = result.reduce((sum, report) => sum + report.total_orders, 0);
    
    expect(totalRevenue).toBe(250.00);
    expect(totalOrders).toBe(2);
  });

  it('should generate monthly sales report', async () => {
    // Create a test cashier user
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'test_cashier',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = cashierResult[0].id;

    // Create orders in different months
    await db.insert(ordersTable)
      .values([
        {
          cashier_id: cashierId,
          total_amount: '200.00',
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          cashier_id: cashierId,
          total_amount: '300.00',
          payment_method: 'card',
          status: 'completed',
          created_at: new Date('2024-02-15T10:00:00Z')
        }
      ])
      .execute();

    const input: SalesReportInput = {
      start_date: '2024-01-01',
      end_date: '2024-02-29',
      group_by: 'month'
    };

    const result = await getSalesReport(input);

    expect(result).toHaveLength(2);
    
    const jan2024 = result.find(r => r.period === '2024-01');
    const feb2024 = result.find(r => r.period === '2024-02');
    
    expect(jan2024).toBeDefined();
    expect(jan2024!.total_revenue).toBe(200.00);
    expect(jan2024!.total_orders).toBe(1);
    
    expect(feb2024).toBeDefined();
    expect(feb2024!.total_revenue).toBe(300.00);
    expect(feb2024!.total_orders).toBe(1);
  });

  it('should only include completed orders', async () => {
    // Create a test cashier user
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'test_cashier',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = cashierResult[0].id;

    // Create orders with different statuses
    await db.insert(ordersTable)
      .values([
        {
          cashier_id: cashierId,
          total_amount: '50.00',
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          cashier_id: cashierId,
          total_amount: '100.00',
          payment_method: 'card',
          status: 'pending',
          created_at: new Date('2024-01-15T11:00:00Z')
        },
        {
          cashier_id: cashierId,
          total_amount: '75.00',
          payment_method: 'digital_wallet',
          status: 'cancelled',
          created_at: new Date('2024-01-15T12:00:00Z')
        }
      ])
      .execute();

    const input: SalesReportInput = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'day'
    };

    const result = await getSalesReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].total_orders).toBe(1); // Only completed order
    expect(result[0].total_revenue).toBe(50.00); // Only completed order amount
  });

  it('should handle date range filtering correctly', async () => {
    // Create a test cashier user
    const cashierResult = await db.insert(usersTable)
      .values({
        username: 'test_cashier',
        email: 'cashier@test.com',
        password_hash: 'hashed_password',
        role: 'cashier'
      })
      .returning()
      .execute();

    const cashierId = cashierResult[0].id;

    // Create orders before, within, and after the date range
    await db.insert(ordersTable)
      .values([
        {
          cashier_id: cashierId,
          total_amount: '25.00',
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date('2023-12-31T23:59:59Z') // Before range
        },
        {
          cashier_id: cashierId,
          total_amount: '50.00',
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date('2024-01-15T10:00:00Z') // Within range
        },
        {
          cashier_id: cashierId,
          total_amount: '75.00',
          payment_method: 'cash',
          status: 'completed',
          created_at: new Date('2024-02-01T00:00:01Z') // After range
        }
      ])
      .execute();

    const input: SalesReportInput = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'day'
    };

    const result = await getSalesReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].total_orders).toBe(1);
    expect(result[0].total_revenue).toBe(50.00); // Only the order within range
  });
});
