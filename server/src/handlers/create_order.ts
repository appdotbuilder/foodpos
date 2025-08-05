
import { db } from '../db';
import { ordersTable, orderItemsTable, productsTable } from '../db/schema';
import { type CreateOrderInput, type Order } from '../schema';
import { eq, SQL } from 'drizzle-orm';

export async function createOrder(input: CreateOrderInput, cashierId: number): Promise<Order> {
  try {
    // Start transaction by using database transaction
    const result = await db.transaction(async (tx) => {
      // First, calculate total amount and validate products exist with sufficient stock
      let totalAmount = 0;
      const productUpdates: { id: number, newStock: number }[] = [];

      for (const item of input.items) {
        // Get product details and current stock
        const products = await tx.select()
          .from(productsTable)
          .where(eq(productsTable.id, item.product_id))
          .execute();

        if (products.length === 0) {
          throw new Error(`Product with id ${item.product_id} not found`);
        }

        const product = products[0];
        
        // Check if product is active
        if (!product.is_active) {
          throw new Error(`Product ${product.name} is not active`);
        }

        // Check stock availability
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
        }

        // Calculate item total
        const unitPrice = parseFloat(product.price);
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;

        // Prepare stock update
        productUpdates.push({
          id: product.id,
          newStock: product.stock_quantity - item.quantity
        });
      }

      // Create the order
      const orderResult = await tx.insert(ordersTable)
        .values({
          queue_id: input.queue_id || null,
          cashier_id: cashierId,
          total_amount: totalAmount.toString(),
          payment_method: input.payment_method,
          status: 'pending',
          notes: input.notes || null
        })
        .returning()
        .execute();

      const order = orderResult[0];

      // Create order items
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        
        // Get product price again (we already validated it exists)
        const products = await tx.select()
          .from(productsTable)
          .where(eq(productsTable.id, item.product_id))
          .execute();
        
        const product = products[0];
        const unitPrice = parseFloat(product.price);
        const totalPrice = unitPrice * item.quantity;

        await tx.insert(orderItemsTable)
          .values({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: unitPrice.toString(),
            total_price: totalPrice.toString()
          })
          .execute();
      }

      // Update product stock quantities
      for (const update of productUpdates) {
        await tx.update(productsTable)
          .set({ stock_quantity: update.newStock })
          .where(eq(productsTable.id, update.id))
          .execute();
      }

      return order;
    });

    // Convert numeric fields back to numbers before returning
    return {
      ...result,
      total_amount: parseFloat(result.total_amount)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
}
