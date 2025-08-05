
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Clock, CheckCircle, XCircle, DollarSign, ChefHat } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Order } from '../../../server/src/schema';

export function OrderManagement() {
  const [todaysOrders, setTodaysOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const todayOrders = await trpc.getTodaysOrders.query();
      setTodaysOrders(todayOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateOrderStatus = async (orderId: number, status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    setIsLoading(true);
    try {
      await trpc.updateOrderStatus.mutate({ id: orderId, status });
      setTodaysOrders((prev: Order[]) => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status, updated_at: new Date() }
            : order
        )
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'digital_wallet': return '📱';
      default: return '💰';
    }
  };

  const filteredOrders = selectedStatus === 'all' 
    ? todaysOrders 
    : todaysOrders.filter(order => order.status === selectedStatus);

  const todayStats = {
    total: todaysOrders.length,
    revenue: todaysOrders.reduce((sum, order) => sum + order.total_amount, 0),
    pending: todaysOrders.filter(o => o.status === 'pending').length,
    preparing: todaysOrders.filter(o => o.status === 'preparing').length,
    ready: todaysOrders.filter(o => o.status === 'ready').length,
    completed: todaysOrders.filter(o => o.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧾 Order Management</h1>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>
        <Button onClick={loadOrders} variant="outline">
          <Receipt className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold">{todayStats.total}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${todayStats.revenue.toFixed(2)}
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
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{todayStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Preparing</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.preparing}</p>
              </div>
              <ChefHat className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.ready}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium">Filter by status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">⏳ Pending</SelectItem>
                <SelectItem value="preparing">👨‍🍳 Preparing</SelectItem>
                <SelectItem value="ready">✅ Ready</SelectItem>
                <SelectItem value="completed">📋 Completed</SelectItem>
                <SelectItem value="cancelled">❌ Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🧾</div>
              <p className="text-sm">No orders found</p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedStatus === 'all' 
                  ? 'Orders will appear here when customers place them' 
                  : `No ${selectedStatus} orders at the moment`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Queue #</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: Order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      {order.queue_id ? (
                        <Badge variant="outline">Q#{order.queue_id}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{getPaymentMethodIcon(order.payment_method)}</span>
                        <span className="capitalize text-sm">{order.payment_method.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {order.created_at.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            disabled={isLoading}
                          >
                            👨‍🍳 Start
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            disabled={isLoading}
                          >
                            ✅ Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            disabled={isLoading}
                          >
                            📋 Complete
                          </Button>
                        )}
                        {!['completed', 'cancelled'].includes(order.status) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            disabled={isLoading}
                          >
                            ❌
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
