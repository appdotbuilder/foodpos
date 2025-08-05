
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { lt, eq, and } from 'drizzle-orm';

export async function getLowStockProducts(threshold: number = 10): Promise<Product[]> {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(
        and(
          lt(productsTable.stock_quantity, threshold),
          eq(productsTable.is_active, true)
        )
      )
      .execute();

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));
  } catch (error) {
    console.error('Failed to fetch low stock products:', error);
    throw error;
  }
}
