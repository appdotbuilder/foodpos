
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Plus, Phone, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Queue, CreateQueueInput, UpdateQueueStatusInput } from '../../../server/src/schema';

export function QueueManagement() {
  const [queue, setQueue] = useState<Queue[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQueueNumber, setCurrentQueueNumber] = useState<number | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      const [queueData, currentNumber] = await Promise.all([
        trpc.getQueue.query(),
        trpc.getCurrentQueueNumber.query()
      ]);
      setQueue(queueData);
      // Fix: getCurrentQueueNumber returns a number, not a Queue object
      setCurrentQueueNumber(typeof currentNumber === 'number' ? currentNumber : null);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const addToQueue = async () => {
    setIsLoading(true);
    try {
      const queueData: CreateQueueInput = {
        customer_name: customerName.trim() || null
      };
      
      const newQueueItem = await trpc.createQueueNumber.mutate(queueData);
      setQueue((prev: Queue[]) => [...prev, newQueueItem]);
      setCustomerName('');
    } catch (error) {
      console.error('Failed to add to queue:', error);
      alert('Failed to add customer to queue');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQueueStatus = async (id: number, status: 'waiting' | 'called' | 'served' | 'cancelled') => {
    try {
      const updateData: UpdateQueueStatusInput = { id, status };
      await trpc.updateQueueStatus.mutate(updateData);
      
      setQueue((prev: Queue[]) => 
        prev.map(item => 
          item.id === id 
            ? { ...item, status, 
                called_at: status === 'called' ? new Date() : item.called_at,
                served_at: status === 'served' ? new Date() : item.served_at 
              }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to update queue status:', error);
      alert('Failed to update queue status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'called': return 'bg-blue-100 text-blue-800';
      case 'served': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="h-4 w-4" />;
      case 'called': return <Phone className="h-4 w-4" />;
      case 'served': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const waitingQueue = queue.filter(item => item.status === 'waiting');
  const calledQueue = queue.filter(item => item.status === 'called');
  const completedQueue = queue.filter(item => ['served', 'cancelled'].includes(item.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎫 Queue Management</h1>
          <p className="text-gray-600">Manage customer queue and service flow</p>
        </div>
        <Button onClick={loadQueue} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Number</p>
                <p className="text-2xl font-bold">{currentQueueNumber || '-'}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-md">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-yellow-600">{waitingQueue.length}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-md">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Called</p>
                <p className="text-2xl font-bold text-blue-600">{calledQueue.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-md">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-green-600">{queue.length}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-md">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add to Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Add Customer to Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="👤 Customer name (optional)"
              value={customerName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToQueue()}
              className="flex-1"
            />
            <Button onClick={addToQueue} disabled={isLoading}>
              {isLoading ? 'Adding...' : '🎫 Get Number'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Waiting Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" />
              ⏳ Waiting ({waitingQueue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-auto">
              {waitingQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-sm">No customers waiting</p>
                </div>
              ) : (
                waitingQueue.map((item: Queue) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-lg font-bold">
                          #{item.queue_number}
                        </Badge>
                        <Badge className={`${getStatusColor(item.status)} flex items-center gap-1`}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {item.customer_name && (
                      <p className="text-sm font-medium mb-2">👤 {item.customer_name}</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mb-3">
                      Added: {item.created_at.toLocaleTimeString()}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => updateQueueStatus(item.id, 'called')}
                        className="flex-1"
                      >
                        📢 Call
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateQueueStatus(item.id, 'cancelled')}
                      >
                        ❌
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Called Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Phone className="h-5 w-5" />
              📢 Called ({calledQueue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-auto">
              {calledQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📢</div>
                  <p className="text-sm">No customers called</p>
                </div>
              ) : (
                calledQueue.map((item: Queue) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-lg font-bold">
                          #{item.queue_number}
                        </Badge>
                        <Badge className={`${getStatusColor(item.status)} flex items-center gap-1`}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {item.customer_name && (
                      <p className="text-sm font-medium mb-2">👤 {item.customer_name}</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mb-3">
                      Called: {item.called_at?.toLocaleTimeString()}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => updateQueueStatus(item.id, 'served')}
                        className="flex-1"
                      >
                        ✅ Served
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateQueueStatus(item.id, 'waiting')}
                      >
                        ↩️
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              ✅ Completed ({completedQueue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-auto">
              {completedQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm">No completed services</p>
                </div>
              ) : (
                completedQueue.slice(-10).reverse().map((item: Queue) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm">
                          #{item.queue_number}
                        </Badge>
                        <Badge className={`${getStatusColor(item.status)} flex items-center gap-1`}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {item.customer_name && (
                      <p className="text-sm font-medium mb-2">👤 {item.customer_name}</p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {item.status === 'served' ? 'Served' : 'Cancelled'}: {
                        (item.served_at || item.called_at)?.toLocaleTimeString()
                      }
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
