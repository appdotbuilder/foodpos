
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Category');
    expect(result.description).toEqual('A category for testing');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category with null description', async () => {
    const inputWithoutDescription: CreateCategoryInput = {
      name: 'No Description Category'
    };

    const result = await createCategory(inputWithoutDescription);

    expect(result.name).toEqual('No Description Category');
    expect(result.description).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].description).toEqual('A category for testing');
    expect(categories[0].is_active).toBe(true);
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle undefined description correctly', async () => {
    const inputWithUndefinedDescription: CreateCategoryInput = {
      name: 'Undefined Description Category',
      description: undefined
    };

    const result = await createCategory(inputWithUndefinedDescription);

    expect(result.name).toEqual('Undefined Description Category');
    expect(result.description).toBeNull();

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].description).toBeNull();
  });
});
