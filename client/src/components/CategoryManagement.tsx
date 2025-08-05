
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Store, Plus, Package } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Category, CreateCategoryInput } from '../../../server/src/schema';

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await trpc.getCategories.query();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newCategory = await trpc.createCategory.mutate(formData);
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏪 Category Management</h1>
          <p className="text-gray-600">Organize your products into categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Category name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateCategoryInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Create Category'}
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Categories</p>
                <p className="text-2xl font-bold text-green-600">
                  {categories.filter(c => c.is_active).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🏪</div>
              <p className="text-sm">No categories found</p>
              <p className="text-xs text-gray-400 mt-1">Add your first category to organize products</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="font-medium">{category.name}</div>
                    </TableCell>
                    <TableCell>
                      {category.description ? (
                        <span className="text-gray-600">{category.description}</span>
                      ) : (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={category.is_active ? "secondary" : "outline"}
                      >
                        {category.is_active ? '✅ Active' : '❌ Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {category.created_at.toLocaleDateString()}
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
