
import { db } from '../db';
import { ordersTable, productsTable, queueTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { eq, and, gte, lt, count, sum, sql } from 'drizzle-orm';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count today's orders
    const todayOrdersResult = await db.select({ 
      count: count() 
    })
      .from(ordersTable)
      .where(
        and(
          gte(ordersTable.created_at, today),
          lt(ordersTable.created_at, tomorrow)
        )
      )
      .execute();

    const today_orders = todayOrdersResult[0]?.count || 0;

    // Calculate today's revenue
    const todayRevenueResult = await db.select({
      total: sum(ordersTable.total_amount)
    })
      .from(ordersTable)
      .where(
        and(
          gte(ordersTable.created_at, today),
          lt(ordersTable.created_at, tomorrow)
        )
      )
      .execute();

    const revenueSum = todayRevenueResult[0]?.total;
    const today_revenue = revenueSum ? parseFloat(revenueSum) : 0;

    // Count queue length (waiting and called statuses)
    const queueLengthResult = await db.select({
      count: count()
    })
      .from(queueTable)
      .where(
        and(
          eq(queueTable.queue_date, sql`CURRENT_DATE`),
          sql`${queueTable.status} IN ('waiting', 'called')`
        )
      )
      .execute();

    const queue_length = queueLengthResult[0]?.count || 0;

    // Count active products
    const activeProductsResult = await db.select({
      count: count()
    })
      .from(productsTable)
      .where(eq(productsTable.is_active, true))
      .execute();

    const active_products = activeProductsResult[0]?.count || 0;

    // Count low stock products (stock_quantity <= 10 and active)
    const lowStockResult = await db.select({
      count: count()
    })
      .from(productsTable)
      .where(
        and(
          eq(productsTable.is_active, true),
          sql`${productsTable.stock_quantity} <= 10`
        )
      )
      .execute();

    const low_stock_products = lowStockResult[0]?.count || 0;

    return {
      today_orders,
      today_revenue,
      queue_length,
      active_products,
      low_stock_products
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
}
