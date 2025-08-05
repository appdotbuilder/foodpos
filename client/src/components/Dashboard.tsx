
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, DollarSign, ShoppingCart, Clock, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '../../../server/src/schema';

interface DashboardProps {
  stats: DashboardStats;
  onRefresh: () => void;
}

export function Dashboard({ stats, onRefresh }: DashboardProps) {
  const statCards = [
    {
      title: "Today's Revenue",
      value: `$${stats.today_revenue.toFixed(2)}`,
      description: "Total sales today",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Orders",
      value: stats.today_orders.toString(),
      description: "Orders processed today",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Queue Length",
      value: stats.queue_length.toString(),
      description: "Customers waiting",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Active Products",
      value: stats.active_products.toString(),
      description: "Products in menu",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard</h1>
          <p className="text-gray-600">Real-time overview of your restaurant operations</p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              System Alerts
            </CardTitle>
            <CardDescription>Important notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.low_stock_products > 0 ? (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Low Stock Alert</span>
                </div>
                <Badge variant="destructive">{stats.low_stock_products} items</Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">All products in stock</span>
                </div>
                <Badge variant="secondary">✓</Badge>
              </div>
            )}

            {stats.queue_length > 10 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Long Queue</span>
                </div>
                <Badge variant="outline">{stats.queue_length} waiting</Badge>
              </div>
            )}

            {stats.low_stock_products === 0 && stats.queue_length <= 10 && (
              <div className="text-center py-4 text-gray-500">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-sm">All systems running smoothly!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Process New Order
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Call Next Customer
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Daily Queue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest orders and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">Recent activity will appear here</p>
            <p className="text-xs text-gray-400 mt-1">Connect to database to see real-time updates</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
