
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput, type CreateCategoryInput } from '../schema';
import { getLowStockProducts } from '../handlers/get_low_stock_products';

// Test category input
const testCategory: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing'
};

// Test product inputs with different stock levels
const lowStockProduct: CreateProductInput = {
  name: 'Low Stock Product',
  description: 'Product with low stock',
  price: 15.99,
  category_id: 1,
  stock_quantity: 5
};

const mediumStockProduct: CreateProductInput = {
  name: 'Medium Stock Product',
  description: 'Product with medium stock',
  price: 25.50,
  category_id: 1,
  stock_quantity: 15
};

const zeroStockProduct: CreateProductInput = {
  name: 'Zero Stock Product',
  description: 'Product with no stock',
  price: 12.00,
  category_id: 1,
  stock_quantity: 0
};

const inactiveProduct: CreateProductInput = {
  name: 'Inactive Low Stock Product',
  description: 'Inactive product with low stock',
  price: 8.99,
  category_id: 1,
  stock_quantity: 3
};

describe('getLowStockProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products with stock below default threshold', async () => {
    // Create category first
    await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .execute();

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: lowStockProduct.name,
          description: lowStockProduct.description,
          price: lowStockProduct.price.toString(),
          category_id: lowStockProduct.category_id,
          stock_quantity: lowStockProduct.stock_quantity
        },
        {
          name: mediumStockProduct.name,
          description: mediumStockProduct.description,
          price: mediumStockProduct.price.toString(),
          category_id: mediumStockProduct.category_id,
          stock_quantity: mediumStockProduct.stock_quantity
        }
      ])
      .execute();

    const result = await getLowStockProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Low Stock Product');
    expect(result[0].stock_quantity).toEqual(5);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(15.99);
    expect(result[0].is_active).toBe(true);
  });

  it('should return products with stock below custom threshold', async () => {
    // Create category first
    await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .execute();

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: lowStockProduct.name,
          description: lowStockProduct.description,
          price: lowStockProduct.price.toString(),
          category_id: lowStockProduct.category_id,
          stock_quantity: lowStockProduct.stock_quantity
        },
        {
          name: mediumStockProduct.name,
          description: mediumStockProduct.description,
          price: mediumStockProduct.price.toString(),
          category_id: mediumStockProduct.category_id,
          stock_quantity: mediumStockProduct.stock_quantity
        }
      ])
      .execute();

    const result = await getLowStockProducts(20);

    expect(result).toHaveLength(2);
    expect(result.map(p => p.name)).toContain('Low Stock Product');
    expect(result.map(p => p.name)).toContain('Medium Stock Product');
  });

  it('should include products with zero stock', async () => {
    // Create category first
    await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .execute();

    // Create product with zero stock
    await db.insert(productsTable)
      .values({
        name: zeroStockProduct.name,
        description: zeroStockProduct.description,
        price: zeroStockProduct.price.toString(),
        category_id: zeroStockProduct.category_id,
        stock_quantity: zeroStockProduct.stock_quantity
      })
      .execute();

    const result = await getLowStockProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Zero Stock Product');
    expect(result[0].stock_quantity).toEqual(0);
  });

  it('should exclude inactive products', async () => {
    // Create category first
    await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .execute();

    // Create inactive product with low stock
    await db.insert(productsTable)
      .values({
        name: inactiveProduct.name,
        description: inactiveProduct.description,
        price: inactiveProduct.price.toString(),
        category_id: inactiveProduct.category_id,
        stock_quantity: inactiveProduct.stock_quantity,
        is_active: false
      })
      .execute();

    const result = await getLowStockProducts();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no products are below threshold', async () => {
    // Create category first
    await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .execute();

    // Create product with high stock
    await db.insert(productsTable)
      .values({
        name: mediumStockProduct.name,
        description: mediumStockProduct.description,
        price: mediumStockProduct.price.toString(),
        category_id: mediumStockProduct.category_id,
        stock_quantity: mediumStockProduct.stock_quantity
      })
      .execute();

    const result = await getLowStockProducts(5);

    expect(result).toHaveLength(0);
  });
});
