
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Store, Save } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { StoreSettings as StoreSettingsType, UpdateStoreSettingsInput } from '../../../server/src/schema';

export function StoreSettings() {
  const [settings, setSettings] = useState<StoreSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<UpdateStoreSettingsInput>({
    store_name: '',
    address: '',
    phone: '',
    email: '',
    tax_rate: 0,
    currency: 'USD',
    receipt_footer: '',
    queue_reset_time: '00:00'
  });

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settingsData = await trpc.getStoreSettings.query();
      setSettings(settingsData);
      setFormData({
        store_name: settingsData.store_name,
        address: settingsData.address,
        phone: settingsData.phone,
        email: settingsData.email,
        tax_rate: settingsData.tax_rate,
        currency: settingsData.currency,
        receipt_footer: settingsData.receipt_footer,
        queue_reset_time: settingsData.queue_reset_time
      });
    } catch (error) {
      console.error('Failed to load store settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedSettings = await trpc.updateStoreSettings.mutate(formData);
      setSettings(updatedSettings);
      alert('Store settings updated successfully!');
    } catch (error) {
      console.error('Failed to update store settings:', error);
      alert('Failed to update store settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading store settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Store Settings</h1>
          <p className="text-gray-600">Configure your restaurant information and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              🏪 Basic Information
            </CardTitle>
            <CardDescription>
              Basic details about your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Store Name</label>
                <Input
                  placeholder="Your Restaurant Name"
                  value={formData.store_name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateStoreSettingsInput) => ({ 
                      ...prev, 
                      store_name: e.target.value 
                    }))
                  }
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  placeholder="(555) 123-4567"
                  value={formData.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateStoreSettingsInput) => ({ 
                      ...prev, 
                      phone: e.target.value || null 
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="contact@restaurant.com"
                value={formData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateStoreSettingsInput) => ({ 
                    ...prev, 
                    email: e.target.value || null 
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Address</label>
              <Textarea
                placeholder="123 Main Street, City, State, ZIP"
                value={formData.address || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: UpdateStoreSettingsInput) => ({ 
                    ...prev, 
                    address: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              💰 Financial Settings
            </CardTitle>
            <CardDescription>
              Configure tax rates and currency settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Tax Rate (%)</label>
                <Input
                  type="number"
                  placeholder="8.25"
                  value={formData.tax_rate || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateStoreSettingsInput) => ({ 
                      ...prev, 
                      tax_rate: parseFloat(e.target.value) || 0 
                    }))
                  }
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Currency</label>
                <Input
                  placeholder="USD"
                  value={formData.currency || 'USD'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateStoreSettingsInput) => ({ 
                      ...prev, 
                      currency: e.target.value.toUpperCase().slice(0, 3) 
                    }))
                  }
                  maxLength={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              🎫 Queue Settings
            </CardTitle>
            <CardDescription>
              Configure queue management preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Daily Queue Reset Time</label>
              <Input
                type="time"
                value={formData.queue_reset_time || '00:00'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateStoreSettingsInput) => ({ 
                    ...prev, 
                    queue_reset_time: e.target.value 
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Queue numbers will automatically reset at this time each day
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              🧾 Receipt Settings
            </CardTitle>
            <CardDescription>
              Customize receipt appearance and messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Receipt Footer</label>
              <Textarea
                placeholder="Thank you for your visit! Have a great day!"
                value={formData.receipt_footer || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: UpdateStoreSettingsInput) => ({ 
                    ...prev, 
                    receipt_footer: e.target.value || null 
                  }))
                }
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will appear at the bottom of all receipts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="min-w-32">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      {/* Current Settings Summary */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Current Settings Summary</CardTitle>
            <CardDescription>Overview of your current store configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-600">Store Name</p>
                <p className="font-medium">{settings.store_name}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-600">Tax Rate</p>
                <p className="font-medium">{settings.tax_rate}%</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-600">Currency</p>
                <p className="font-medium">{settings.currency}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-600">Queue Reset</p>
                <p className="font-medium">{settings.queue_reset_time}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="font-medium">{settings.updated_at.toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
