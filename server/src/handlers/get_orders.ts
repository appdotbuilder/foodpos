
import { db } from '../db';
import { ordersTable, usersTable, queueTable } from '../db/schema';
import { type Order } from '../schema';
import { eq } from 'drizzle-orm';

export async function getOrders(): Promise<Order[]> {
  try {
    const results = await db.select()
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.cashier_id, usersTable.id))
      .leftJoin(queueTable, eq(ordersTable.queue_id, queueTable.id))
      .execute();

    return results.map(result => ({
      id: result.orders.id,
      queue_id: result.orders.queue_id,
      cashier_id: result.orders.cashier_id,
      total_amount: parseFloat(result.orders.total_amount),
      payment_method: result.orders.payment_method,
      status: result.orders.status,
      notes: result.orders.notes,
      created_at: result.orders.created_at,
      updated_at: result.orders.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}
