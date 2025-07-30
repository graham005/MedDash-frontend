import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePharmacyOrders, useMedicines } from '@/hooks/usePharmacy';
import { useCurrentUser } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TruckIcon, ClipboardDocumentIcon, BeakerIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import CreatePharmacistProfileModal from './profile/CreateProfile';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

function PharmacistHomePage() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading, error } = usePharmacyOrders();
  const { data: medicines = [] } = useMedicines();

  // Stats
  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    return {
      total: orders.length,
      pending,
      processing,
      ready,
      completed,
      cancelled,
      medicines: medicines.length,
    };
  }, [orders, medicines]);

  // Recent orders
  const recentOrders = useMemo(() => {
    return orders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-2">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pharmacy Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage orders and inventory efficiently
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate({ to: '/dashboard/pharmacist/orders' })}
            >
              <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
              View All Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/dashboard/pharmacist/inventory' })}
            >
              <BeakerIcon className="w-5 h-5 mr-2" />
              Manage Inventory
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Total Orders</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.processing}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Processing</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.ready}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Ready</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">{stats.completed}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.cancelled}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Cancelled</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BeakerIcon className="w-5 h-5" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.medicines}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Medicines</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/dashboard/pharmacist/inventory' })}
                >
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate({ to: '/dashboard/pharmacist/orders' })}
                >
                  <TruckIcon className="w-4 h-4 mr-3" />
                  View Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: '/dashboard/pharmacist/inventory' })}
                >
                  <BeakerIcon className="w-4 h-4 mr-3" />
                  Manage Inventory
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Recent Orders
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/dashboard/pharmacist/orders' })}
            >
              View All
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading orders...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error loading orders.
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent orders.
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-gray-100 dark:border-slate-700 pb-3"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Order #{order.id.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate({
                            to: `/dashboard/pharmacist/orders/${order.id}`,
                            params: { orderId: order.id },
                          })
                        }
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PharmacistDashboard() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  useEffect(() => {
    // Check if user needs to create a profile
    if (currentUser && (!currentUser.profile || Object.keys(currentUser.profile).length === 0)) {
      setShowProfileModal(true);
    }
  }, [currentUser]);
  
  const closeProfileModal = () => {
    setShowProfileModal(false);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Dashboard Content */}
      <PharmacistHomePage />
      
      {/* Profile creation modal */}
      <CreatePharmacistProfileModal 
        isOpen={showProfileModal} 
        onClose={closeProfileModal} 
      />
    </>
  );
}