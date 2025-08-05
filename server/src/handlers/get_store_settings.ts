
import { db } from '../db';
import { storeSettingsTable } from '../db/schema';
import { type StoreSettings } from '../schema';

export const getStoreSettings = async (): Promise<StoreSettings> => {
  try {
    // Check if settings exist
    const results = await db.select()
      .from(storeSettingsTable)
      .execute();

    if (results.length > 0) {
      // Return existing settings with numeric conversion
      const settings = results[0];
      return {
        ...settings,
        tax_rate: parseFloat(settings.tax_rate) // Convert numeric field to number
      };
    }

    // Create default settings if none exist
    const defaultSettings = await db.insert(storeSettingsTable)
      .values({
        store_name: 'Default Store',
        address: null,
        phone: null,
        email: null,
        tax_rate: '0.0000', // Convert number to string for numeric column
        currency: 'USD',
        receipt_footer: null,
        queue_reset_time: '00:00'
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const settings = defaultSettings[0];
    return {
      ...settings,
      tax_rate: parseFloat(settings.tax_rate)
    };
  } catch (error) {
    console.error('Get store settings failed:', error);
    throw error;
  }
};
