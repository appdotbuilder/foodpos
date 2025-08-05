
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, Edit, AlertTriangle, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Product, Category, CreateProductInput, UpdateProductInput } from '../../../server/src/schema';

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    description: null,
    price: 0,
    category_id: 0,
    stock_quantity: 0,
    image_url: null
  });

  const loadData = useCallback(async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getCategories.query()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: null,
      price: 0,
      category_id: 0,
      stock_quantity: 0,
      image_url: null
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.category_id,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingProduct) {
        // Update existing product
        const updateData: UpdateProductInput = {
          id: editingProduct.id,
          ...formData
        };
        const updatedProduct = await trpc.updateProduct.mutate(updateData);
        setProducts((prev: Product[]) => 
          prev.map(p => p.id === editingProduct.id ? updatedProduct : p)
        );
      } else {
        // Create new product
        const newProduct = await trpc.createProduct.mutate(formData);
        setProducts((prev: Product[]) => [...prev, newProduct]);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const lowStockProducts = products.filter(p => p.stock_quantity < 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Product Management</h1>
          <p className="text-gray-600">Manage your menu items and inventory</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Product name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateProductInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateProductInput) => ({ 
                        ...prev, 
                        price: parseFloat(e.target.value) || 0 
                      }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <Input
                    type="number"
                    placeholder="Stock quantity"
                    value={formData.stock_quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateProductInput) => ({ 
                        ...prev, 
                        stock_quantity: parseInt(e.target.value) || 0 
                      }))
                    }
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <Select 
                  value={formData.category_id.toString()} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateProductInput) => ({ 
                      ...prev, 
                      category_id: parseInt(value) 
                    }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  placeholder="Image URL (optional)"
                  value={formData.image_url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProductInput) => ({
                      ...prev,
                      image_url: e.target.value || null
                    }))
                  }
                  type="url"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.is_active).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Low Stock Alert
            </CardTitle>
            <CardDescription className="text-red-700">
              The following products have low stock (less than 10 items)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockProducts.map((product: Product) => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                  <span className="font-medium">{product.name}</span>
                  <Badge variant="destructive">
                    {product.stock_quantity} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="🔍 Search products..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm">No products found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Add your first product to get started'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryName(product.category_id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.stock_quantity < 10 ? "destructive" : "secondary"}
                      >
                        {product.stock_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.is_active ? "secondary" : "outline"}
                      >
                        {product.is_active ? '✅ Active' : '❌ Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
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
