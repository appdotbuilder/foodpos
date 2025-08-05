
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type SalesReportInput, type SalesReport } from '../schema';
import { sql, between, and, gte, lte } from 'drizzle-orm';

export async function getSalesReport(input: SalesReportInput): Promise<SalesReport[]> {
  try {
    const { start_date, end_date, group_by = 'day' } = input;
    
    // Parse date strings to Date objects
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    // Set end date to end of day for inclusive range
    endDate.setHours(23, 59, 59, 999);

    let dateFormat: string;
    let dateGroupBy: string;
    
    switch (group_by) {
      case 'week':
        // PostgreSQL week format: YYYY-"W"WW
        dateFormat = 'YYYY-"W"IW';
        dateGroupBy = `date_trunc('week', created_at)`;
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGroupBy = `date_trunc('month', created_at)`;
        break;
      case 'day':
      default:
        dateFormat = 'YYYY-MM-DD';
        dateGroupBy = `date_trunc('day', created_at)`;
        break;
    }

    const result = await db.execute(sql`
      SELECT 
        to_char(${sql.raw(dateGroupBy)}, ${dateFormat}) as period,
        COUNT(*)::int as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM ${ordersTable}
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND status = 'completed'
      GROUP BY ${sql.raw(dateGroupBy)}
      ORDER BY ${sql.raw(dateGroupBy)}
    `);

    return result.rows.map((row: any) => ({
      period: row.period,
      total_orders: parseInt(row.total_orders),
      total_revenue: parseFloat(row.total_revenue),
      average_order_value: parseFloat(row.average_order_value)
    }));
  } catch (error) {
    console.error('Sales report generation failed:', error);
    throw error;
  }
}
