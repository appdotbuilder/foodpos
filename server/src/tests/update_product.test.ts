
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type UpdateProductInput, type CreateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let productId: number;

  beforeEach(async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    
    categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Original Product',
        description: 'Original description',
        price: '19.99',
        category_id: categoryId,
        stock_quantity: 100,
        image_url: 'http://example.com/image.jpg'
      })
      .returning()
      .execute();

    productId = productResult[0].id;
  });

  it('should update product name', async () => {
    const input: UpdateProductInput = {
      id: productId,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(input);

    expect(result.id).toEqual(productId);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdateProductInput = {
      id: productId,
      name: 'New Name',
      description: 'New description',
      price: 29.99,
      stock_quantity: 50,
      is_active: false
    };

    const result = await updateProduct(input);

    expect(result.name).toEqual('New Name');
    expect(result.description).toEqual('New description');
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toBe('number');
    expect(result.stock_quantity).toEqual(50);
    expect(result.is_active).toEqual(false);
    expect(result.category_id).toEqual(categoryId); // Unchanged
  });

  it('should update product in database', async () => {
    const input: UpdateProductInput = {
      id: productId,
      name: 'Database Updated Product',
      price: 39.99
    };

    await updateProduct(input);

    // Verify changes in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Updated Product');
    expect(parseFloat(products[0].price)).toEqual(39.99);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update nullable fields to null', async () => {
    const input: UpdateProductInput = {
      id: productId,
      description: null,
      image_url: null
    };

    const result = await updateProduct(input);

    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.name).toEqual('Original Product'); // Unchanged
  });

  it('should throw error for non-existent product', async () => {
    const input: UpdateProductInput = {
      id: 99999,
      name: 'This should fail'
    };

    expect(() => updateProduct(input)).toThrow(/Product with id 99999 not found/i);
  });

  it('should update category_id correctly', async () => {
    // Create another category
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'New Category',
        description: 'Another category'
      })
      .returning()
      .execute();

    const newCategoryId = newCategoryResult[0].id;

    const input: UpdateProductInput = {
      id: productId,
      category_id: newCategoryId
    };

    const result = await updateProduct(input);

    expect(result.category_id).toEqual(newCategoryId);
    expect(result.name).toEqual('Original Product'); // Unchanged
  });
});
