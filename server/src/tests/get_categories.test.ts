
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return only active categories', async () => {
    // Insert test categories
    await db.insert(categoriesTable)
      .values([
        { name: 'Active Category 1', description: 'First active category', is_active: true },
        { name: 'Active Category 2', description: 'Second active category', is_active: true },
        { name: 'Inactive Category', description: 'This should not appear', is_active: false }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result.every(category => category.is_active)).toBe(true);
    expect(result.map(c => c.name)).toContain('Active Category 1');
    expect(result.map(c => c.name)).toContain('Active Category 2');
    expect(result.map(c => c.name)).not.toContain('Inactive Category');
  });

  it('should return categories with all required fields', async () => {
    await db.insert(categoriesTable)
      .values({ name: 'Test Category', description: 'Test description', is_active: true })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];
    expect(category.id).toBeDefined();
    expect(category.name).toEqual('Test Category');
    expect(category.description).toEqual('Test description');
    expect(category.is_active).toBe(true);
    expect(category.created_at).toBeInstanceOf(Date);
  });

  it('should handle categories with null descriptions', async () => {
    await db.insert(categoriesTable)
      .values({ name: 'Category No Desc', description: null, is_active: true })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Category No Desc');
    expect(result[0].description).toBeNull();
  });
});
