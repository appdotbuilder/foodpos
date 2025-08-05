
import { db } from '../db';
import { ordersTable, orderItemsTable } from '../db/schema';
import { type Order, type OrderItem } from '../schema';
import { eq } from 'drizzle-orm';

export async function getOrderById(orderId: number): Promise<{ order: Order; items: OrderItem[] } | null> {
  try {
    // Get the order
    const orderResults = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .execute();

    if (orderResults.length === 0) {
      return null;
    }

    const orderData = orderResults[0];

    // Convert numeric fields to numbers
    const order: Order = {
      ...orderData,
      total_amount: parseFloat(orderData.total_amount)
    };

    // Get order items
    const itemResults = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, orderId))
      .execute();

    // Convert numeric fields to numbers for items
    const items: OrderItem[] = itemResults.map(item => ({
      ...item,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price)
    }));

    return { order, items };
  } catch (error) {
    console.error('Failed to get order by id:', error);
    throw error;
  }
}
