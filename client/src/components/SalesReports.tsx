
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Download, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { SalesReport, SalesReportInput } from '../../../server/src/schema';

export function SalesReports() {
  const [reportData, setReportData] = useState<SalesReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  // Set default dates (last 7 days)
  useState(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
  });

  const generateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setIsLoading(true);
    try {
      const reportInput: SalesReportInput = {
        start_date: startDate,
        end_date: endDate,
        group_by: groupBy
      };
      
      const data = await trpc.getSalesReport.query(reportInput);
      setReportData(data);
    } catch (error) {
      console.error('Failed to generate sales report:', error);
      alert('Failed to generate sales report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, groupBy]);

  const getTotalRevenue = () => {
    return reportData.reduce((sum, item) => sum + item.total_revenue, 0);
  };

  const getTotalOrders = () => {
    return reportData.reduce((sum, item) => sum + item.total_orders, 0);
  };

  const getAverageOrderValue = () => {
    const totalRevenue = getTotalRevenue();
    const totalOrders = getTotalOrders();
    return totalOrders > 0 ? totalRevenue / totalOrders : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Sales Reports</h1>
          <p className="text-gray-600">Analyze your restaurant's sales performance</p>
        </div>
      </div>

      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            📅 Report Parameters
          </CardTitle>
          <CardDescription>
            Configure your sales report settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Group By</label>
              <Select value={groupBy} onValueChange={(value: 'day' | 'week' | 'month') => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">📅 Daily</SelectItem>
                  <SelectItem value="week">📊 Weekly</SelectItem>
                  <SelectItem value="month">📈 Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={isLoading} className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {reportData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${getTotalRevenue().toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{getTotalOrders()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${getAverageOrderValue().toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📈 Sales Report Data</CardTitle>
              <CardDescription>
                {reportData.length > 0 
                  ? `Showing ${reportData.length} ${groupBy === 'day' ? 'days' : groupBy === 'week' ? 'weeks' : 'months'} of data`
                  : 'Generate a report to see sales data'
                }
              </CardDescription>
            </div>
            {reportData.length > 0 && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {reportData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">No report data</p>
              <p className="text-xs text-gray-400 mt-1">
                Select date range and generate a report to see sales analytics
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg. Order Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item: SalesReport, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.period}</TableCell>
                    <TableCell>{item.total_orders}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      ${item.total_revenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${item.average_order_value.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📈 Revenue Trend</CardTitle>
            <CardDescription>Visual representation of sales over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">Chart visualization</p>
              <p className="text-xs text-gray-400 mt-1">
                Chart component would display sales trends here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
