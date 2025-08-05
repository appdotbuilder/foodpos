
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storeSettingsTable } from '../db/schema';
import { getStoreSettings } from '../handlers/get_store_settings';

describe('getStoreSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create default settings when none exist', async () => {
    const result = await getStoreSettings();

    // Verify default values
    expect(result.store_name).toEqual('Default Store');
    expect(result.address).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.tax_rate).toEqual(0);
    expect(typeof result.tax_rate).toEqual('number');
    expect(result.currency).toEqual('USD');
    expect(result.receipt_footer).toBeNull();
    expect(result.queue_reset_time).toEqual('00:00');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save default settings to database', async () => {
    const result = await getStoreSettings();

    // Verify settings were saved to database
    const settings = await db.select()
      .from(storeSettingsTable)
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].store_name).toEqual('Default Store');
    expect(settings[0].currency).toEqual('USD');
    expect(parseFloat(settings[0].tax_rate)).toEqual(0);
    expect(settings[0].id).toEqual(result.id);
  });

  it('should return existing settings when they exist', async () => {
    // Create existing settings
    await db.insert(storeSettingsTable)
      .values({
        store_name: 'My Coffee Shop',
        address: '123 Main St',
        phone: '555-1234',
        email: 'info@coffeeshop.com',
        tax_rate: '0.0875', // 8.75% tax rate
        currency: 'EUR',
        receipt_footer: 'Thank you for your business!',
        queue_reset_time: '06:00'
      })
      .execute();

    const result = await getStoreSettings();

    // Verify existing settings are returned
    expect(result.store_name).toEqual('My Coffee Shop');
    expect(result.address).toEqual('123 Main St');
    expect(result.phone).toEqual('555-1234');
    expect(result.email).toEqual('info@coffeeshop.com');
    expect(result.tax_rate).toEqual(0.0875);
    expect(typeof result.tax_rate).toEqual('number');
    expect(result.currency).toEqual('EUR');
    expect(result.receipt_footer).toEqual('Thank you for your business!');
    expect(result.queue_reset_time).toEqual('06:00');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return first settings record when multiple exist', async () => {
    // Create multiple settings records
    await db.insert(storeSettingsTable)
      .values({
        store_name: 'First Store',
        tax_rate: '0.1000'
      })
      .execute();

    await db.insert(storeSettingsTable)
      .values({
        store_name: 'Second Store',
        tax_rate: '0.2000'
      })
      .execute();

    const result = await getStoreSettings();

    // Should return the first record
    expect(result.store_name).toEqual('First Store');
    expect(result.tax_rate).toEqual(0.1);
    expect(typeof result.tax_rate).toEqual('number');
  });
});
