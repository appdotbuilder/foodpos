
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { getProductsByCategory } from '../handlers/get_products_by_category';

describe('getProductsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products for a specific category', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          description: 'Gaming laptop',
          price: '999.99',
          category_id: categoryId,
          stock_quantity: 10
        },
        {
          name: 'Phone',
          description: 'Smartphone',
          price: '599.99',
          category_id: categoryId,
          stock_quantity: 20
        }
      ])
      .execute();

    const results = await getProductsByCategory(categoryId);

    expect(results).toHaveLength(2);
    expect(results[0].name).toEqual('Laptop');
    expect(results[0].price).toEqual(999.99);
    expect(typeof results[0].price).toBe('number');
    expect(results[0].category_id).toEqual(categoryId);
    expect(results[0].is_active).toBe(true);
    
    expect(results[1].name).toEqual('Phone');
    expect(results[1].price).toEqual(599.99);
    expect(typeof results[1].price).toBe('number');
    expect(results[1].category_id).toEqual(categoryId);
  });

  it('should return empty array for category with no products', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Empty Category',
        description: 'Category with no products'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    const results = await getProductsByCategory(categoryId);

    expect(results).toHaveLength(0);
  });

  it('should only return active products', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Mixed Category',
        description: 'Category with active and inactive products'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create active and inactive products
    await db.insert(productsTable)
      .values([
        {
          name: 'Active Product',
          description: 'This product is active',
          price: '29.99',
          category_id: categoryId,
          stock_quantity: 5,
          is_active: true
        },
        {
          name: 'Inactive Product',
          description: 'This product is inactive',
          price: '19.99',
          category_id: categoryId,
          stock_quantity: 3,
          is_active: false
        }
      ])
      .execute();

    const results = await getProductsByCategory(categoryId);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Active Product');
    expect(results[0].is_active).toBe(true);
  });

  it('should return empty array for non-existent category', async () => {
    const nonExistentCategoryId = 999;

    const results = await getProductsByCategory(nonExistentCategoryId);

    expect(results).toHaveLength(0);
  });

  it('should handle products with different stock quantities', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Stock Test Category',
        description: 'Testing different stock quantities'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create products with different stock quantities
    await db.insert(productsTable)
      .values([
        {
          name: 'In Stock Product',
          description: 'Product with stock',
          price: '15.99',
          category_id: categoryId,
          stock_quantity: 50
        },
        {
          name: 'Out of Stock Product',
          description: 'Product with no stock',
          price: '25.99',
          category_id: categoryId,
          stock_quantity: 0
        }
      ])
      .execute();

    const results = await getProductsByCategory(categoryId);

    expect(results).toHaveLength(2);
    
    const inStockProduct = results.find(p => p.name === 'In Stock Product');
    const outOfStockProduct = results.find(p => p.name === 'Out of Stock Product');

    expect(inStockProduct?.stock_quantity).toEqual(50);
    expect(outOfStockProduct?.stock_quantity).toEqual(0);
  });
});
