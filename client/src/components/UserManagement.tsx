
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Shield, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User as UserType, CreateUserInput } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    role: 'cashier'
  });

  const loadUsers = useCallback(async () => {
    try {
      const usersData = await trpc.getUsers.query();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'cashier'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newUser = await trpc.createUser.mutate(formData);
      setUsers((prev: UserType[]) => [...prev, newUser]);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: 'admin' | 'cashier') => 
                    setFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Cashier
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Create User'}
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
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cashiers</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'cashier').length}
                </p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">No users found</p>
              <p className="text-xs text-gray-400 mt-1">Add users to manage your POS system</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: UserType) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' ? (
                          <Shield className="h-4 w-4 text-purple-600" />
                        ) : (
                          <User className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
                      >
                        {user.role === 'admin' ? '🛡️ Admin' : '👤 Cashier'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.is_active ? "secondary" : "outline"}
                      >
                        {user.is_active ? '✅ Active' : '❌ Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {user.created_at.toLocaleDateString()}
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
