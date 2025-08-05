
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type Order } from '../schema';
import { gte, lt, and } from 'drizzle-orm';

export async function getTodaysOrders(): Promise<Order[]> {
  try {
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = await db.select()
      .from(ordersTable)
      .where(
        and(
          gte(ordersTable.created_at, today),
          lt(ordersTable.created_at, tomorrow)
        )
      )
      .execute();

    // Convert numeric fields back to numbers
    return results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));
  } catch (error) {
    console.error('Failed to get today\'s orders:', error);
    throw error;
  }
}
