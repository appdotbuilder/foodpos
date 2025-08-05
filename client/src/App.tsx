
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Settings, 
  BarChart3, 
  Clock, 
  Menu,
  Store,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { Dashboard } from '@/components/Dashboard';
import { ProductManagement } from '@/components/ProductManagement';
import { CategoryManagement } from '@/components/CategoryManagement';
import { QueueManagement } from '@/components/QueueManagement';
import { OrderManagement } from '@/components/OrderManagement';
import { UserManagement } from '@/components/UserManagement';
import { StoreSettings } from '@/components/StoreSettings';
import { SalesReports } from '@/components/SalesReports';
import { POSCashier } from '@/components/POSCashier';
import type { DashboardStats, User } from '../../server/src/schema';

type NavigationItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
  { id: 'queue', label: 'Queue Management', icon: Clock },
  { id: 'orders', label: 'Orders', icon: Receipt },
  { id: 'products', label: 'Products', icon: Package, adminOnly: true },
  { id: 'categories', label: 'Categories', icon: Store, adminOnly: true },
  { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
  { id: 'reports', label: 'Sales Reports', icon: BarChart3, adminOnly: true },
  { id: 'settings', label: 'Store Settings', icon: Settings, adminOnly: true },
];

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    today_orders: 0,
    today_revenue: 0,
    queue_length: 0,
    active_products: 0,
    low_stock_products: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Current user - this would come from authentication context in production
  const currentUser: User = {
    id: 1,
    username: 'admin',
    email: 'admin@pos.com',
    password_hash: '',
    role: 'admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };

  const loadDashboardStats = useCallback(async () => {
    try {
      const stats = await trpc.getDashboardStats.query();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard stats={dashboardStats} onRefresh={loadDashboardStats} />;
      case 'pos':
        return <POSCashier currentUser={currentUser} />;
      case 'queue':
        return <QueueManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'products':
        return <ProductManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'users':
        return <UserManagement />;
      case 'reports':
        return <SalesReports />;
      case 'settings':
        return <StoreSettings />;
      default:
        return <Dashboard stats={dashboardStats} onRefresh={loadDashboardStats} />;
    }
  };

  const filteredNavItems = navigationItems.filter(
    item => !item.adminOnly || currentUser.role === 'admin'
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Store className="mr-2 h-6 w-6 text-orange-600" />
        <h1 className="text-lg font-semibold text-gray-900">🍔 QuickServe POS</h1>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className="justify-start"
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
      
      {/* Quick Stats in Sidebar */}
      <div className="border-t p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Queue Length</span>
            <Badge variant="outline">{dashboardStats.queue_length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Today's Orders</span>
            <Badge variant="outline">{dashboardStats.today_orders}</Badge>
          </div>
          {dashboardStats.low_stock_products > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Stock
              </span>
              <Badge variant="destructive">{dashboardStats.low_stock_products}</Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b">
          <div className="flex h-14 items-center gap-4 px-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold capitalize">
                  {activeSection.replace('-', ' ')}
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome back, {currentUser.username}! 
                  <Badge variant="outline" className="ml-2">
                    {currentUser.role}
                  </Badge>
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">Live</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="font-medium">
                    Today: ${dashboardStats.today_revenue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading POS system...</p>
              </div>
            </div>
          ) : (
            renderActiveSection()
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
