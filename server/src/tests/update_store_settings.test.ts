
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storeSettingsTable } from '../db/schema';
import { type UpdateStoreSettingsInput } from '../schema';
import { updateStoreSettings } from '../handlers/update_store_settings';

describe('updateStoreSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create initial settings when none exist', async () => {
    const input: UpdateStoreSettingsInput = {
      store_name: 'Test Store',
      address: '123 Test St',
      phone: '+1234567890',
      email: 'test@store.com',
      tax_rate: 0.08,
      currency: 'USD',
      receipt_footer: 'Thank you for your business!',
      queue_reset_time: '06:00'
    };

    const result = await updateStoreSettings(input);

    expect(result.store_name).toEqual('Test Store');
    expect(result.address).toEqual('123 Test St');
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('test@store.com');
    expect(result.tax_rate).toEqual(0.08);
    expect(typeof result.tax_rate).toEqual('number');
    expect(result.currency).toEqual('USD');
    expect(result.receipt_footer).toEqual('Thank you for your business!');
    expect(result.queue_reset_time).toEqual('06:00');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing settings', async () => {
    // Create initial settings
    await db.insert(storeSettingsTable)
      .values({
        store_name: 'Original Store',
        address: 'Original Address',
        phone: '+1111111111',
        email: 'original@store.com',
        tax_rate: '0.0500',
        currency: 'EUR',
        receipt_footer: 'Original footer',
        queue_reset_time: '08:00'
      })
      .execute();

    const input: UpdateStoreSettingsInput = {
      store_name: 'Updated Store',
      tax_rate: 0.10,
      currency: 'USD'
    };

    const result = await updateStoreSettings(input);

    expect(result.store_name).toEqual('Updated Store');
    expect(result.address).toEqual('Original Address'); // Should remain unchanged
    expect(result.phone).toEqual('+1111111111'); // Should remain unchanged
    expect(result.email).toEqual('original@store.com'); // Should remain unchanged
    expect(result.tax_rate).toEqual(0.10);
    expect(typeof result.tax_rate).toEqual('number');
    expect(result.currency).toEqual('USD');
    expect(result.receipt_footer).toEqual('Original footer'); // Should remain unchanged
    expect(result.queue_reset_time).toEqual('08:00'); // Should remain unchanged
  });

  it('should handle null values correctly', async () => {
    const input: UpdateStoreSettingsInput = {
      store_name: 'Null Test Store',
      address: null,
      phone: null,
      email: null,
      receipt_footer: null
    };

    const result = await updateStoreSettings(input);

    expect(result.store_name).toEqual('Null Test Store');
    expect(result.address).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.receipt_footer).toBeNull();
  });

  it('should save settings to database', async () => {
    const input: UpdateStoreSettingsInput = {
      store_name: 'Database Test Store',
      tax_rate: 0.15
    };

    const result = await updateStoreSettings(input);

    const settings = await db.select()
      .from(storeSettingsTable)
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].store_name).toEqual('Database Test Store');
    expect(parseFloat(settings[0].tax_rate)).toEqual(0.15);
    expect(settings[0].id).toEqual(result.id);
  });

  it('should use defaults when creating initial settings with minimal input', async () => {
    const input: UpdateStoreSettingsInput = {
      store_name: 'Minimal Store'
    };

    const result = await updateStoreSettings(input);

    expect(result.store_name).toEqual('Minimal Store');
    expect(result.address).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.tax_rate).toEqual(0.0000);
    expect(result.currency).toEqual('USD');
    expect(result.receipt_footer).toBeNull();
    expect(result.queue_reset_time).toEqual('00:00');
  });

  it('should update timestamps correctly', async () => {
    // Create initial settings
    const initialTime = new Date('2023-01-01T00:00:00Z');
    await db.insert(storeSettingsTable)
      .values({
        store_name: 'Time Test Store',
        created_at: initialTime,
        updated_at: initialTime
      })
      .execute();

    const input: UpdateStoreSettingsInput = {
      store_name: 'Updated Time Test Store'
    };

    const result = await updateStoreSettings(input);

    expect(result.created_at).toEqual(initialTime);
    expect(result.updated_at).not.toEqual(initialTime);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
