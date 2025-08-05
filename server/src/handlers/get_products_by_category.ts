
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getProductsByCategory = async (categoryId: number): Promise<Product[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(and(
        eq(productsTable.category_id, categoryId),
        eq(productsTable.is_active, true)
      ))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));
  } catch (error) {
    console.error('Failed to fetch products by category:', error);
    throw error;
  }
};
