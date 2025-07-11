import { useMemo, useState } from 'react';
import { usePharmacyOrders } from '@/hooks/usePharmacy';
import { OrderStatus,type PharmacyOrder } from '@/api/pharmacy-order';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-[#8491D9] text-[#010626]',
  [OrderStatus.CONFIRMED]: 'bg-[#021373] text-white',
  [OrderStatus.PROCESSING]: 'bg-[#020F59] text-white',
  [OrderStatus.READY]: 'bg-green-600 text-white',
  [OrderStatus.COMPLETED]: 'bg-[#010626] text-white',
  [OrderStatus.CANCELLED]: 'bg-red-600 text-white',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.PROCESSING]: 'Processing',
  [OrderStatus.READY]: 'Ready',
  [OrderStatus.COMPLETED]: 'Completed',
  [OrderStatus.CANCELLED]: 'Cancelled',
};

const PAGE_SIZE = 10;

export default function Orders() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading, error } = usePharmacyOrders();

  // Filters & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [page, setPage] = useState(1);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.READY]: 0,
      [OrderStatus.COMPLETED]: 0,
      [OrderStatus.CANCELLED]: 0,
    };
    orders.forEach(order => {
      if (order.status in counts) counts[order.status]++;
    });
    return counts;
  }, [orders]);

  // Filtered and searched orders
  const filteredOrders = useMemo(() => {
    let filtered = orders as PharmacyOrder[];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    if (search.trim()) {
      filtered = filtered.filter(order =>
        order.prescription?.name?.toLowerCase().includes(search.toLowerCase()) ||
        order.prescription?.patient?.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        order.prescription?.patient?.user?.lastName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [orders, statusFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Format date
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen dark:from-[#010626] dark:via-[#021373] dark:to-[#8491D9] transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#021373] dark:text-[#8491D9]">Pharmacy Orders</h1>
            <p className="text-[#021373] dark:text-gray-300 mt-1">View and manage all pharmacy orders</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 ">
          {Object.values(OrderStatus).map(status => (
            <Card
              key={status}
              className={`shadow-md h-25 border-0 bg-[#021373] dark:bg-[#8491D9] text-white transition`}
            >
              <CardContent className="py-4 flex flex-col ">
                <span className="text-lg font-bold">{statusCounts[status as OrderStatus]}</span>
                <span className="text-xs font-medium uppercase tracking-wide">{STATUS_LABELS[status as OrderStatus]}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8491D9]" />
              <Input
                type="text"
                placeholder="Search by prescription or patient..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 border-[#8491D9] dark:border-[#8491D9] dark:bg-[#010626] dark:text-white"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="border rounded-lg px-3 py-2 dark:bg-[#010626] dark:text-white border-[#8491D9] dark:border-[#8491D9]"
              >
                <option value="all">All Status</option>
                {Object.values(OrderStatus).map(status => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status as OrderStatus]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-[#8491D9] dark:divide-[#8491D9]">
            <thead>
              <tr className="bg-[#021373] dark:bg-[#020F59] text-white">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Prescription</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#8491D9]">
                    Loading orders...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-red-500">
                    Failed to load orders.
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#021373] dark:text-gray-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#8491D9]/10 dark:hover:bg-[#8491D9]/20 transition"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      {order.prescription?.name ?? (
                        <span className="text-red-500">Prescription missing</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.prescription?.patient?.user
                        ? `${order.prescription.patient.user.firstName} ${order.prescription.patient.user.lastName}`
                        : <span className="text-red-500">Patient info missing</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">Ksh {order.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        className="bg-[#021373] hover:bg-[#8491D9] text-white"
                        onClick={() => navigate({ to: `/dashboard/pharmacist/orders/${order.id}` })}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-[#021373] dark:text-gray-300">
            Showing {(page - 1) * PAGE_SIZE + 1}
            -
            {Math.min(page * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length} orders
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-[#8491D9] text-[#021373] dark:border-[#8491D9] dark:text-[#8491D9]"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="px-2 py-1 text-sm font-medium text-[#021373] dark:text-[#8491D9]">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-[#8491D9] text-[#021373] dark:border-[#8491D9] dark:text-[#8491D9]"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}