
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // First, check if product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Prepare update values, converting numeric fields to strings
    const updateValues: any = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateValues.description = input.description;
    }
    
    if (input.price !== undefined) {
      updateValues.price = input.price.toString(); // Convert number to string for numeric column
    }
    
    if (input.category_id !== undefined) {
      updateValues.category_id = input.category_id;
    }
    
    if (input.stock_quantity !== undefined) {
      updateValues.stock_quantity = input.stock_quantity;
    }
    
    if (input.is_active !== undefined) {
      updateValues.is_active = input.is_active;
    }
    
    if (input.image_url !== undefined) {
      updateValues.image_url = input.image_url;
    }

    // Set updated_at timestamp
    updateValues.updated_at = new Date();

    // Update product record
    const result = await db.update(productsTable)
      .set(updateValues)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
