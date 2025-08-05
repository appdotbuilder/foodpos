
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test category setup
const testCategory = {
  name: 'Test Category',
  description: 'A category for testing'
};

// Test input with all fields
const testInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  price: 19.99,
  category_id: 1, // Will be set after category creation
  stock_quantity: 100,
  image_url: 'https://example.com/product.jpg'
};

describe('createProduct', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    
    testInput.category_id = categoryResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual('A product for testing');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
    expect(result.category_id).toEqual(testInput.category_id);
    expect(result.stock_quantity).toEqual(100);
    expect(result.is_active).toEqual(true);
    expect(result.image_url).toEqual('https://example.com/product.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with optional fields as null', async () => {
    const minimalInput: CreateProductInput = {
      name: 'Minimal Product',
      price: 9.99,
      category_id: testInput.category_id,
      stock_quantity: 50
    };

    const result = await createProduct(minimalInput);

    expect(result.name).toEqual('Minimal Product');
    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.price).toEqual(9.99);
    expect(result.stock_quantity).toEqual(50);
  });

  it('should save product to database correctly', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Test Product');
    expect(savedProduct.description).toEqual('A product for testing');
    expect(parseFloat(savedProduct.price)).toEqual(19.99);
    expect(savedProduct.category_id).toEqual(testInput.category_id);
    expect(savedProduct.stock_quantity).toEqual(100);
    expect(savedProduct.is_active).toEqual(true);
    expect(savedProduct.image_url).toEqual('https://example.com/product.jpg');
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when category does not exist', async () => {
    const invalidInput: CreateProductInput = {
      ...testInput,
      category_id: 999 // Non-existent category
    };

    await expect(createProduct(invalidInput)).rejects.toThrow(/Category with id 999 does not exist/i);
  });

  it('should handle zero stock quantity', async () => {
    const zeroStockInput: CreateProductInput = {
      ...testInput,
      stock_quantity: 0
    };

    const result = await createProduct(zeroStockInput);

    expect(result.stock_quantity).toEqual(0);
  });

  it('should handle decimal prices correctly', async () => {
    const decimalPriceInput: CreateProductInput = {
      ...testInput,
      price: 12.34 // Use 2 decimal places to match PostgreSQL numeric(10, 2) precision
    };

    const result = await createProduct(decimalPriceInput);

    expect(result.price).toEqual(12.34);
    expect(typeof result.price).toEqual('number');

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(parseFloat(products[0].price)).toEqual(12.34);
  });
});
