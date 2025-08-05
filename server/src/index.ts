
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  loginInputSchema,
  createCategoryInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  createQueueInputSchema,
  updateQueueStatusInputSchema,
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  updateStoreSettingsInputSchema,
  salesReportInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { login } from './handlers/login';
import { getUsers } from './handlers/get_users';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { updateProduct } from './handlers/update_product';
import { getProductsByCategory } from './handlers/get_products_by_category';
import { createQueueNumber } from './handlers/create_queue_number';
import { getQueue } from './handlers/get_queue';
import { updateQueueStatus } from './handlers/update_queue_status';
import { getCurrentQueueNumber } from './handlers/get_current_queue_number';
import { createOrder } from './handlers/create_order';
import { getOrders } from './handlers/get_orders';
import { getOrderById } from './handlers/get_order_by_id';
import { updateOrderStatus } from './handlers/update_order_status';
import { getTodaysOrders } from './handlers/get_todays_orders';
import { getStoreSettings } from './handlers/get_store_settings';
import { updateStoreSettings } from './handlers/update_store_settings';
import { getSalesReport } from './handlers/get_sales_report';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { getLowStockProducts } from './handlers/get_low_stock_products';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // User management routes (Admin only)
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) =>  createUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  // Category management routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),

  // Product management routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  getProducts: publicProcedure
    .query(() => getProducts()),

  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  getProductsByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(({ input }) => getProductsByCategory(input.categoryId)),

  getLowStockProducts: publicProcedure
    .input(z.object({ threshold: z.number().optional() }))
    .query(({ input }) => getLowStockProducts(input.threshold)),

  // Queue management routes
  createQueueNumber: publicProcedure
    .input(createQueueInputSchema)
    .mutation(({ input }) => createQueueNumber(input)),

  getQueue: publicProcedure
    .query(() => getQueue()),

  updateQueueStatus: publicProcedure
    .input(updateQueueStatusInputSchema)
    .mutation(({ input }) => updateQueueStatus(input)),

  getCurrentQueueNumber: publicProcedure
    .query(() => getCurrentQueueNumber()),

  // Order management routes
  createOrder: publicProcedure
    .input(createOrderInputSchema.extend({ cashierId: z.number() }))
    .mutation(({ input }) => createOrder(input, input.cashierId)),

  getOrders: publicProcedure
    .query(() => getOrders()),

  getOrderById: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(({ input }) => getOrderById(input.orderId)),

  updateOrderStatus: publicProcedure
    .input(updateOrderStatusInputSchema)
    .mutation(({ input }) => updateOrderStatus(input)),

  getTodaysOrders: publicProcedure
    .query(() => getTodaysOrders()),

  // Store settings routes
  getStoreSettings: publicProcedure
    .query(() => getStoreSettings()),

  updateStoreSettings: publicProcedure
    .input(updateStoreSettingsInputSchema)
    .mutation(({ input }) => updateStoreSettings(input)),

  // Analytics and reporting routes
  getSalesReport: publicProcedure
    .input(salesReportInputSchema)
    .query(({ input }) => getSalesReport(input)),

  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
