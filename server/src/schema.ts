
import { z } from 'zod';

// Enums
export const userRoleEnum = z.enum(['admin', 'cashier']);
export const orderStatusEnum = z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']);
export const paymentMethodEnum = z.enum(['cash', 'card', 'digital_wallet']);
export const queueStatusEnum = z.enum(['waiting', 'called', 'served', 'cancelled']);

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleEnum
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Category schemas
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  category_id: z.number(),
  stock_quantity: z.number().int(),
  is_active: z.boolean(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  price: z.number().positive(),
  category_id: z.number(),
  stock_quantity: z.number().int().nonnegative(),
  image_url: z.string().url().nullable().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  category_id: z.number().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  image_url: z.string().url().nullable().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Queue schemas
export const queueSchema = z.object({
  id: z.number(),
  queue_number: z.number().int(),
  customer_name: z.string().nullable(),
  status: queueStatusEnum,
  created_at: z.coerce.date(),
  called_at: z.coerce.date().nullable(),
  served_at: z.coerce.date().nullable(),
  queue_date: z.coerce.date()
});

export type Queue = z.infer<typeof queueSchema>;

export const createQueueInputSchema = z.object({
  customer_name: z.string().nullable().optional()
});

export type CreateQueueInput = z.infer<typeof createQueueInputSchema>;

export const updateQueueStatusInputSchema = z.object({
  id: z.number(),
  status: queueStatusEnum
});

export type UpdateQueueStatusInput = z.infer<typeof updateQueueStatusInputSchema>;

// Order schemas
export const orderSchema = z.object({
  id: z.number(),
  queue_id: z.number().nullable(),
  cashier_id: z.number(),
  total_amount: z.number(),
  payment_method: paymentMethodEnum,
  status: orderStatusEnum,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const createOrderInputSchema = z.object({
  queue_id: z.number().nullable().optional(),
  payment_method: paymentMethodEnum,
  notes: z.string().nullable().optional(),
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().int().positive()
  })).min(1)
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  id: z.number(),
  status: orderStatusEnum
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;

// Store settings schemas
export const storeSettingsSchema = z.object({
  id: z.number(),
  store_name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  tax_rate: z.number(),
  currency: z.string(),
  receipt_footer: z.string().nullable(),
  queue_reset_time: z.string(), // Time format "HH:MM"
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

export const updateStoreSettingsInputSchema = z.object({
  store_name: z.string().min(1).max(200).optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  tax_rate: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(), // ISO currency code
  receipt_footer: z.string().nullable().optional(),
  queue_reset_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional() // HH:MM format
});

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsInputSchema>;

// Analytics schemas
export const salesReportInputSchema = z.object({
  start_date: z.string().date(),
  end_date: z.string().date(),
  group_by: z.enum(['day', 'week', 'month']).optional()
});

export type SalesReportInput = z.infer<typeof salesReportInputSchema>;

export const salesReportSchema = z.object({
  period: z.string(),
  total_orders: z.number().int(),
  total_revenue: z.number(),
  average_order_value: z.number()
});

export type SalesReport = z.infer<typeof salesReportSchema>;

export const dashboardStatsSchema = z.object({
  today_orders: z.number().int(),
  today_revenue: z.number(),
  queue_length: z.number().int(),
  active_products: z.number().int(),
  low_stock_products: z.number().int()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
