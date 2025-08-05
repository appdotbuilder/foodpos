
import { db } from '../db';
import { storeSettingsTable } from '../db/schema';
import { type UpdateStoreSettingsInput, type StoreSettings } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStoreSettings = async (input: UpdateStoreSettingsInput): Promise<StoreSettings> => {
  try {
    // First, check if store settings exist
    const existing = await db.select()
      .from(storeSettingsTable)
      .limit(1)
      .execute();

    if (existing.length === 0) {
      // Create initial store settings if none exist
      const result = await db.insert(storeSettingsTable)
        .values({
          store_name: input.store_name || 'My Store',
          address: input.address || null,
          phone: input.phone || null,
          email: input.email || null,
          tax_rate: input.tax_rate?.toString() || '0.0000',
          currency: input.currency || 'USD',
          receipt_footer: input.receipt_footer || null,
          queue_reset_time: input.queue_reset_time || '00:00'
        })
        .returning()
        .execute();

      const settings = result[0];
      return {
        ...settings,
        tax_rate: parseFloat(settings.tax_rate)
      };
    }

    // Update existing settings
    const updateData: any = {};
    
    if (input.store_name !== undefined) updateData.store_name = input.store_name;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.tax_rate !== undefined) updateData.tax_rate = input.tax_rate.toString();
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.receipt_footer !== undefined) updateData.receipt_footer = input.receipt_footer;
    if (input.queue_reset_time !== undefined) updateData.queue_reset_time = input.queue_reset_time;

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    const result = await db.update(storeSettingsTable)
      .set(updateData)
      .where(eq(storeSettingsTable.id, existing[0].id))
      .returning()
      .execute();

    const settings = result[0];
    return {
      ...settings,
      tax_rate: parseFloat(settings.tax_rate)
    };
  } catch (error) {
    console.error('Store settings update failed:', error);
    throw error;
  }
};
