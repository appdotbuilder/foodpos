
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'cashier']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'preparing', 'ready', 'completed', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'digital_wallet']);
export const queueStatusEnum = pgEnum('queue_status', ['waiting', 'called', 'served', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category_id: integer('category_id').references(() => categoriesTable.id).notNull(),
  stock_quantity: integer('stock_quantity').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Queue table
export const queueTable = pgTable('queue', {
  id: serial('id').primaryKey(),
  queue_number: integer('queue_number').notNull(),
  customer_name: text('customer_name'),
  status: queueStatusEnum('status').default('waiting').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  called_at: timestamp('called_at'),
  served_at: timestamp('served_at'),
  queue_date: date('queue_date').defaultNow().notNull()
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  queue_id: integer('queue_id').references(() => queueTable.id),
  cashier_id: integer('cashier_id').references(() => usersTable.id).notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Order items table
export const orderItemsTable = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').references(() => ordersTable.id).notNull(),
  product_id: integer('product_id').references(() => productsTable.id).notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull()
});

// Store settings table
export const storeSettingsTable = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  store_name: text('store_name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  tax_rate: numeric('tax_rate', { precision: 5, scale: 4 }).default('0.0000').notNull(),
  currency: text('currency').default('USD').notNull(),
  receipt_footer: text('receipt_footer'),
  queue_reset_time: text('queue_reset_time').default('00:00').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  orders: many(ordersTable)
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  products: many(productsTable)
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [productsTable.category_id],
    references: [categoriesTable.id]
  }),
  orderItems: many(orderItemsTable)
}));

export const queueRelations = relations(queueTable, ({ many }) => ({
  orders: many(ordersTable)
}));

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  queue: one(queueTable, {
    fields: [ordersTable.queue_id],
    references: [queueTable.id]
  }),
  cashier: one(usersTable, {
    fields: [ordersTable.cashier_id],
    references: [usersTable.id]
  }),
  items: many(orderItemsTable)
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.order_id],
    references: [ordersTable.id]
  }),
  product: one(productsTable, {
    fields: [orderItemsTable.product_id],
    references: [productsTable.id]
  })
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  categories: categoriesTable,
  products: productsTable,
  queue: queueTable,
  orders: ordersTable,
  orderItems: orderItemsTable,
  storeSettings: storeSettingsTable
};
