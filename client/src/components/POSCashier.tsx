
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, ShoppingCart, CreditCard, Banknote, Smartphone, Trash2, Receipt } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Product, Category, CreateOrderInput, User } from '../../../server/src/schema';

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSCashierProps {
  currentUser: User;
}

export function POSCashier({ currentUser }: POSCashierProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital_wallet'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getCategories.query()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load POS data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = products.filter((product: Product) => {
    const matchesCategory = selectedCategory === 'all' || product.category_id.toString() === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.is_active;
  });

  const addToCart = (product: Product) => {
    setCart((prev: CartItem[]) => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev: CartItem[]) => prev.filter(item => item.product.id !== productId));
    } else {
      setCart((prev: CartItem[]) => 
        prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (productId: number) => {
    setCart((prev: CartItem[]) => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setOrderNotes('');
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const processOrder = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      // Create queue number if customer name is provided
      let queueId = null;
      if (customerName.trim()) {
        const queue = await trpc.createQueueNumber.mutate({ 
          customer_name: customerName.trim() 
        });
        queueId = queue.id;
      }

      // Create order
      const orderData: CreateOrderInput = {
        queue_id: queueId,
        payment_method: paymentMethod,
        notes: orderNotes || null,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      await trpc.createOrder.mutate({
        ...orderData,
        cashierId: currentUser.id
      });

      // Clear cart after successful order
      clearCart();
      
      // Show success message (in real app, would show receipt)
      alert(`Order processed successfully! ${queueId ? 'Queue number assigned.' : ''}`);
    } catch (error) {
      console.error('Failed to process order:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              🛒 Product Menu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="🔍 Search products..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            <ScrollArea className="h-96">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🍽️</div>
                  <p className="text-sm">No products found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {searchTerm ? 'Try different search terms' : 'Add products to get started'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product: Product) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-sm">{product.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              ${product.price.toFixed(2)}
                            </Badge>
                          </div>
                          {product.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Stock: {product.stock_quantity}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => addToCart(product)}
                              disabled={product.stock_quantity === 0}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Cart and Checkout */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                🧾 Current Order
              </span>
              <Badge variant="outline">{cart.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <Input
                placeholder="👤 Customer name (optional)"
                value={customerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="📝 Order notes (optional)"
                value={orderNotes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrderNotes(e.target.value)}
              />
            </div>

            <Separator />

            {/* Cart Items */}
            <ScrollArea className="h-64">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs text-gray-400 mt-1">Add items to start an order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item: CartItem) => (
                    <div key={item.product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600">
                          ${item.product.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <>
                <Separator />
                
                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'digital_wallet') => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          💵 Cash
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          💳 Card
                        </div>
                      </SelectItem>
                      <SelectItem value="digital_wallet">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          📱 Digital Wallet
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Total */}
                <div className="space-y-2 p-3 bg-green-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-xl font-bold text-green-700">
                      ${getTotalAmount().toFixed(2)}
                    
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={processOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : '🚀 Process Order'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                  >
                    🗑️ Clear Cart
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
