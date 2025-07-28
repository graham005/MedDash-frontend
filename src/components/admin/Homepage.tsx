import { useRef, useEffect, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { usePayments } from "@/hooks/usePayments";
import { UserStatus } from "@/types/enums";
import { useUpdateUser } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, ExclamationTriangleIcon, UserIcon, BellIcon, ArrowTrendingUpIcon, CalendarIcon } from "@heroicons/react/24/solid";
import { Chart } from "chart.js/auto";
import type { User } from "@/api/user";
import { 
  useAdminDashboardStats, 
  useRecentActivities, 
  useSystemAlerts, 
  useUserGrowth 
} from "@/hooks/useAdmin";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useAuth";

// Add ConfirmationDialog component
function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0a1557] border border-indigo-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="text-lg font-semibold mb-3 text-white">{title}</div>
        <div className="text-sm text-indigo-200 mb-6 leading-relaxed">{message}</div>
        <div className="flex gap-3 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="border-indigo-600 text-black hover:bg-indigo-900"
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm}
            className={
              isDestructive 
                ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                : "bg-green-600 hover:bg-green-700 text-white border-green-600"
            }
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserGrowthChart({ data, options }: { data: any; options: any }) {
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        ...options,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          ...options.plugins,
          legend: {
            display: true,
            labels: { 
              color: '#ffffff',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: '#0a1557',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: '#1e40af',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                // Ensure whole numbers in tooltips
                return `${context.dataset.label}: ${Math.round(context.parsed.y)} users`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { 
              color: "#1e293b",
              display: false
            },
            ticks: { 
              color: "#94a3b8",
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 0,
              // Custom callback to shorten date labels
              callback: function(value: number, index: number) {
                const label = this.getLabelForValue(value);
                if (!label) return '';
                
                // Parse different date formats and shorten them
                const date = new Date(label);
                
                // If it's a valid date, format it
                if (!isNaN(date.getTime())) {
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const day = date.getDate();
                  return `${month} ${day}`;
                }
                
                // If it's already a short format or custom format, try to shorten it further
                if (typeof label === 'string') {
                  // Handle formats like "2024-01-15" or "January 15, 2024"
                  if (label.includes('-')) {
                    const parts = label.split('-');
                    if (parts.length === 3) {
                      const date = new Date(label);
                      const month = date.toLocaleDateString('en-US', { month: 'short' });
                      const day = date.getDate();
                      return `${month} ${day}`;
                    }
                  }
                  
                  // Handle month names - shorten long month names
                  const monthMap: { [key: string]: string } = {
                    'January': 'Jan', 'February': 'Feb', 'March': 'Mar',
                    'April': 'Apr', 'May': 'May', 'June': 'Jun',
                    'July': 'Jul', 'August': 'Aug', 'September': 'Sep',
                    'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
                  };
                  
                  let shortened = label;
                  Object.entries(monthMap).forEach(([long, short]) => {
                    shortened = shortened.replace(long, short);
                  });
                  
                  // Remove year if present to save space
                  shortened = shortened.replace(/,?\s*\d{4}/, '');
                  
                  // Limit length and add ellipsis if too long
                  if (shortened.length > 8) {
                    shortened = shortened.substring(0, 6) + '...';
                  }
                  
                  return shortened;
                }
                
                return label;
              }
            },
            border: {
              color: "#334155"
            }
          },
          y: {
            grid: { 
              color: "#1e293b",
              borderDash: [5, 5]
            },
            ticks: { 
              color: "#94a3b8",
              font: {
                size: 12
              },
              callback: function(value: any) {
                // Only show whole numbers
                const roundedValue = Math.round(value);
                return roundedValue + ' users';
              },
              // Force integer steps and prevent decimals
              stepSize: 1,
              precision: 0,
              // Only display tick marks for whole numbers
              filter: function(tickValue: any) {
                return Number.isInteger(tickValue.value);
              }
            },
            border: {
              color: "#334155"
            },
            beginAtZero: true,
            // Ensure the scale uses integer values
            type: 'linear',
            min: 0,
            // Force Chart.js to use whole number intervals
            afterBuildTicks: function(scale: any) {
              scale.ticks = scale.ticks.filter((tick: any) => Number.isInteger(tick.value));
            }
          }
        },
        barPercentage: 0.8,
        categoryPercentage: 0.9,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, options]);

  return (
    <div className="relative h-[300px] w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}

const getActivityIcon = (type: string, severity: string) => {
  switch (type) {
    case 'user_registration':
      return <UserIcon className="w-4 h-4 text-blue-400" />;
    case 'payment_success':
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    case 'emergency_request':
      return <ExclamationTriangleIcon className={`w-4 h-4 ${severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />;
    default:
      return <BellIcon className="w-4 h-4 text-gray-400" />;
  }
};

const getTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function Homepage() {
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const { data: payments = [], isLoading: isLoadingPayments } = usePayments();
  const updateUser = useUpdateUser();
  const [search, setSearch] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  
  // Move pagination state to top level
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  // Add confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    confirmText?: string;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDestructive: false,
    confirmText: "Confirm"
  });

  // Add activity filter state
  const [activityFilter, setActivityFilter] = useState("all");

  // Real data hooks
  const { data: dashboardStats, isLoading: isLoadingStats } = useAdminDashboardStats();
  const { data: recentActivities = [], isLoading: isLoadingActivities } = useRecentActivities(10);
  const { data: systemAlerts = [], isLoading: isLoadingAlerts } = useSystemAlerts();
  const { data: userGrowthData, isLoading: isLoadingGrowth } = useUserGrowth(selectedPeriod);

  // Calculate total revenue from payments (fallback)
  const fallbackRevenue = payments?.reduce(
    (sum, p) => p.status === "success" ? sum + Number(p.amount) : sum,
    0
  );

  // Use real data when available, fallback to existing logic
  const totalRevenue = dashboardStats?.overview.totalRevenue ?? fallbackRevenue;
  const activeUsers = dashboardStats?.overview.activeUsers ?? users.filter(u => u.userStatus === UserStatus.ACTIVE).length;
  const alertsCount = systemAlerts.length;
  
  // Calculate uptime based on system health (simplified)
  const uptime = dashboardStats ? 
    (systemAlerts.filter(a => a.severity === 'critical').length === 0 ? "99.9%" : "98.5%") : 
    "99.9%";

  // Updated user status toggle handler with confirmation
  const handleToggleStatus = (user: User) => {
    const newStatus = user.userStatus === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    const action = newStatus === UserStatus.SUSPENDED ? "disable" : "enable";
    const actionPast = newStatus === UserStatus.SUSPENDED ? "disabled" : "enabled";

    setConfirmDialog({
      open: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} ${user.firstName} ${user.lastName}? ${
        newStatus === UserStatus.SUSPENDED 
          ? "This will prevent the user from accessing the system." 
          : "This will restore the user's access to the system."
      }`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      isDestructive: newStatus === UserStatus.SUSPENDED,
      onConfirm: () => {
        updateUser.mutate(
          { id: user.id, userData: { userStatus: newStatus } },
          {
            onSuccess: () => {
              toast.success(`User ${actionPast} successfully`);
              setConfirmDialog({ ...confirmDialog, open: false });
            },
            onError: (error: any) => {
              toast.error(error?.message || `Failed to ${action} user`);
              setConfirmDialog({ ...confirmDialog, open: false });
            }
          }
        );
      }
    });
  };

  // Filter users by search
  const filteredUsers = users.filter(
    u =>
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Calculate derived values from userGrowthData
  const calculateGrowthMetrics = () => {
    if (!userGrowthData?.summary || !userGrowthData?.datasets?.[0]?.data) {
      return { averageDaily: 'N/A', growthRate: 'N/A' };
    }

    const data = userGrowthData.datasets[0].data as number[];
    const totalUsers = userGrowthData.summary.totalNewUsers;
    
    // Calculate average daily based on period
    let days = 30; // default
    switch (selectedPeriod) {
      case '7days':
        days = 7;
        break;
      case '30days':
        days = 30;
        break;
      case '6months':
        days = 180;
        break;
    }
    
    const averageDaily = totalUsers > 0 ? Math.round((totalUsers / days)*100 ): 0;
    
    // Calculate growth rate (comparing first and last data points)
    const growthRate = data.length > 1 ? 
      Math.round(((data[data.length - 1] - data[0]) / (data[0] || 1)) * 100) : 0;
    
    return {
      averageDaily: averageDaily > 0 ? averageDaily : 'N/A',
      growthRate: !isNaN(growthRate) && isFinite(growthRate) ? `${growthRate}%` : 'N/A'
    };
  };

  const { averageDaily, growthRate } = calculateGrowthMetrics();

  return (
    <div className="min-h-screen bg-[#050a2f] text-white flex">
      {/* SideNavBar is already implemented */}
      <main className="flex-1 p-8">
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-xs text-indigo-200 mb-2">Active Users</span>
              <span className="text-3xl font-bold text-white">
                {isLoadingStats ? "..." : activeUsers.toLocaleString()}
              </span>
              {dashboardStats && (
                <span className="text-xs text-green-400 mt-1">
                  ↗ {dashboardStats.overview.totalUsers} total users
                </span>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-xs text-indigo-200 mb-2">System Alerts</span>
              <span className="text-3xl font-bold text-white">
                {isLoadingAlerts ? "..." : alertsCount}
              </span>
              {systemAlerts.length > 0 && (
                <span className={`text-xs mt-1 ${
                  systemAlerts.some(a => a.severity === 'critical') ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {systemAlerts.filter(a => a.severity === 'critical').length} critical
                </span>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-xs text-indigo-200 mb-2">Total Revenue</span>
              <span className="text-3xl font-bold text-white">
                KES {isLoadingStats ? "..." : totalRevenue?.toLocaleString() || 0}
              </span>
              {dashboardStats && (
                <span className="text-xs text-green-400 mt-1">
                  {dashboardStats.overview.paymentSuccessRate.toFixed(1)}% success rate
                </span>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-xs text-indigo-200 mb-2">System Uptime</span>
              <span className="text-3xl font-bold text-white">{uptime}</span>
              {dashboardStats && (
                <span className="text-xs text-indigo-300 mt-1">
                  {dashboardStats.emergency.active} active emergencies
                </span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col gap-8">
          {/* Real-Time Activity - Full Width */}
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5" />
                Real-Time Activity
                {isLoadingActivities && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin ml-2" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Button 
                  variant={activityFilter === "all" ? "default" : "ghost"} 
                  className={activityFilter === "all" ? "bg-indigo-700 text-white" : "text-indigo-200"}
                  onClick={() => setActivityFilter("all")}
                >
                  All
                </Button>
                <Button 
                  variant={activityFilter === "user" ? "default" : "ghost"} 
                  className={activityFilter === "user" ? "bg-indigo-700 text-white" : "text-indigo-200"}
                  onClick={() => setActivityFilter("user")}
                >
                  Users
                </Button>
                <Button 
                  variant={activityFilter === "payment" ? "default" : "ghost"} 
                  className={activityFilter === "payment" ? "bg-indigo-700 text-white" : "text-indigo-200"}
                  onClick={() => setActivityFilter("payment")}
                >
                  Payments
                </Button>
                <Button 
                  variant={activityFilter === "emergency" ? "default" : "ghost"} 
                  className={activityFilter === "emergency" ? "bg-indigo-700 text-white" : "text-indigo-200"}
                  onClick={() => setActivityFilter("emergency")}
                >
                  Emergency
                </Button>
              </div>
              <ul className="max-h-64 overflow-y-auto">
                {recentActivities.length === 0 ? (
                  <li className="text-center py-4 text-indigo-300">
                    {isLoadingActivities ? "Loading activities..." : "No recent activities"}
                  </li>
                ) : (
                  // Filter activities based on the selected filter
                  recentActivities
                    .filter(activity => 
                      activityFilter === "all" ? true : 
                      activityFilter === "user" ? activity.type.includes("user") : 
                      activityFilter === "payment" ? activity.type.includes("payment") : 
                      activityFilter === "emergency" ? activity.type.includes("emergency") : true
                    )
                    .map((activity) => (
                      <li key={activity.id} className="flex items-center gap-3 py-2 border-b border-indigo-900 last:border-b-0">
                        {getActivityIcon(activity.type, activity.severity)}
                        <span className="text-sm text-white flex-1">{activity.message}</span>
                        <span className="ml-auto text-xs text-indigo-300">
                          {getTimeAgo(activity.timestamp)}
                        </span>
                      </li>
                    ))
                )}
                {/* Show "No matching activities" message when filter returns empty results */}
                {recentActivities.length > 0 && 
                 recentActivities.filter(activity => 
                   activityFilter === "all" ? true : 
                   activityFilter === "user" ? activity.type.includes("user") : 
                   activityFilter === "payment" ? activity.type.includes("payment") : 
                   activityFilter === "emergency" ? activity.type.includes("emergency") : true
                 ).length === 0 && (
                  <li className="text-center py-4 text-indigo-300">
                    No {activityFilter} activities found
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Middle Section - User Management | System Alerts & Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
            {/* Left: User Management */}
            <Card className="bg-[#0a1557] border-0 shadow-md col-span-4">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-3">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="px-3 py-2 rounded bg-[#050a2f] text-white border border-indigo-900 w-64"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-indigo-900 text-indigo-200">
                        <th className="py-2 px-4 text-left">Name</th>
                        <th className="py-2 px-4 text-left">Email</th>
                        <th className="py-2 px-4 text-left">Role</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-indigo-200">Loading users...</td>
                        </tr>
                      ) : (
                        <>
                          {paginatedUsers.map(user => (
                            <tr key={user.id} className="border-b border-indigo-900 last:border-b-0">
                              <td className="py-2 px-4 text-white">{user.firstName} {user.lastName}</td>
                              <td className="py-2 px-4 text-white">{user.email}</td>
                              <td className="py-2 px-4 text-white">{user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1)}</td>
                              <td className="py-2 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  user.userStatus === UserStatus.ACTIVE
                                    ? "bg-green-600 text-white"
                                    : user.userStatus === UserStatus.SUSPENDED
                                    ? "bg-red-600 text-white"
                                    : "bg-gray-600 text-white"
                                }`}>
                                  {(user.userStatus ?? "unknown").charAt(0).toUpperCase() + (user.userStatus ?? "unknown").slice(1)}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                <Button
                                  size="sm"
                                  variant={user.userStatus === UserStatus.ACTIVE ? "outline" : "default"}
                                  className={user.userStatus === UserStatus.ACTIVE 
                                    ? "text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600" 
                                    : "bg-green-600 text-white hover:bg-green-700"
                                  }
                                  onClick={() => handleToggleStatus(user)}
                                  disabled={updateUser.isPending || !user.userStatus}
                                >
                                  {updateUser.isPending ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    user.userStatus === UserStatus.ACTIVE ? "Disable" : "Enable"
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                  
                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-indigo-200 text-xs">
                      Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}-
                      {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-indigo-200"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        Prev
                      </Button>
                      <span className="text-indigo-200 text-xs flex items-center">
                        Page {currentPage} of {totalPages || 1}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-indigo-200"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: System Alerts & Overview */}
            <div className="flex flex-col col-span-2 gap-6">
              {/* System Alerts */}
              <Card className="bg-[#0a1557] border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    System Alerts
                    {isLoadingAlerts && (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin ml-2" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="max-h-48 overflow-y-auto">
                    {systemAlerts.length === 0 ? (
                      <li className="text-center py-4 text-green-400">
                        {isLoadingAlerts ? "Checking alerts..." : "✓ All systems operational"}
                      </li>
                    ) : (
                      systemAlerts.map((alert) => (
                        <li key={alert.id} className="mb-4 p-3 rounded bg-indigo-950 text-white shadow">
                          <span className={`font-bold mr-2 ${
                            alert.severity === "critical"
                              ? "text-red-400"
                              : alert.severity === "warning"
                              ? "text-yellow-300"
                              : "text-blue-300"
                          }`}>{alert.severity.toUpperCase()}</span>
                          {alert.message}
                          <div className="text-xs text-indigo-300 mt-1">
                            {getTimeAgo(alert.timestamp)}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* System Overview */}
              <Card className="bg-[#0a1557] border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-white">System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="text-center py-8 text-indigo-200">Loading system data...</div>
                  ) : dashboardStats ? (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-indigo-200">Appointments</span>
                        <span className="text-white">
                          {dashboardStats.appointments.total} 
                          <span className="text-xs text-green-400 ml-1">
                            ({dashboardStats.appointments.completionRate.toFixed(1)}% completed)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-200">Emergency Requests</span>
                        <span className="text-white">
                          {dashboardStats.emergency.total}
                          <span className="text-xs text-yellow-400 ml-1">
                            ({dashboardStats.emergency.active} active)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-200">Payment Success Rate</span>
                        <span className="text-white">
                          {dashboardStats.overview.paymentSuccessRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="pt-2 border-t border-indigo-800">
                        <div className="text-xs text-indigo-300 mb-2">User Distribution</div>
                        {Object.entries(dashboardStats.userBreakdown).map(([role, count]) => (
                          <div key={role} className="flex justify-between text-xs">
                            <span className="text-indigo-200 capitalize">{role}s</span>
                            <span className="text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-indigo-200 text-center py-12">System analytics loading...</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* User Growth Chart - Full Width with Bar Chart */}
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  User Growth Analytics
                </span>
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-indigo-900 text-white text-xs px-3 py-2 rounded border border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="6months">Last 6 Months</option>
                </select>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              {isLoadingGrowth ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-indigo-200 text-sm">Loading user growth data...</span>
                  </div>
                </div>
              ) : userGrowthData ? (
                <UserGrowthChart
                  data={{
                    ...userGrowthData,
                    datasets: userGrowthData.datasets?.map((dataset: any, index: number) => ({
                      ...dataset,
                      backgroundColor: index === 0 
                        ? 'rgba(59, 130, 246, 0.8)'
                        : index === 1 
                        ? 'rgba(16, 185, 129, 0.8)'
                        : 'rgba(245, 158, 11, 0.8)',
                      borderColor: index === 0 
                        ? 'rgba(59, 130, 246, 1)' 
                        : index === 1 
                        ? 'rgba(16, 185, 129, 1)' 
                        : 'rgba(245, 158, 11, 1)',
                      borderWidth: 1,
                      borderRadius: 4,
                      borderSkipped: false,
                      hoverBackgroundColor: index === 0 
                        ? 'rgba(59, 130, 246, 1)' 
                        : index === 1 
                        ? 'rgba(16, 185, 129, 1)' 
                        : 'rgba(245, 158, 11, 1)',
                      hoverBorderColor: '#ffffff',
                      hoverBorderWidth: 2
                    }))
                  }}
                  options={{
                    plugins: { 
                      legend: { 
                        display: true,
                        labels: { 
                          color: '#ffffff',
                          usePointStyle: true,
                          padding: 20,
                          font: {
                            size: 13
                          }
                        },
                        position: 'top'
                      },
                      tooltip: {
                        backgroundColor: '#0a1557',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        borderColor: '#1e40af',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                          label: function(context: any) {
                            // Ensure whole numbers in tooltips
                            return `${context.dataset.label}: ${Math.round(context.parsed.y)} users`;
                          },
                          title: function(context: any) {
                            const label = context[0].label;
                            const date = new Date(label);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                              });
                            }
                            return label;
                          }
                        }
                      }
                    },
                    scales: { 
                      x: { 
                        grid: { 
                          color: "#1e293b",
                          display: false 
                        },
                        ticks: { 
                          color: "#94a3b8",
                          font: {
                            size: 11
                          },
                          maxRotation: 45,
                          minRotation: 0
                        },
                        border: {
                          color: "#334155"
                        }
                      }, 
                      y: { 
                        grid: { 
                          color: "#1e293b",
                          borderDash: [5, 5]
                        },
                        ticks: { 
                          color: "#94a3b8",
                          font: {
                            size: 12
                          },
                          callback: function(value: any) {
                            // Only show whole numbers
                            const roundedValue = Math.round(value);
                            return roundedValue + ' users';
                          },
                          // Force integer steps and prevent decimals
                          stepSize: 1,
                          precision: 0
                        },
                        border: {
                          color: "#334155"
                        },
                        beginAtZero: true
                      } 
                    },
                    barPercentage: 0.8,
                    categoryPercentage: 0.9,
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    },
                    animation: {
                      duration: 1000,
                      easing: 'easeInOutQuart'
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-indigo-300">
                  <div className="text-center">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No user growth data available</p>
                    <p className="text-xs text-indigo-400 mt-1">Data will appear once users start registering</p>
                  </div>
                </div>
              )}
              
              {/* Enhanced Summary Stats */}
              {userGrowthData?.summary && (
                <div className="p-3 bg-indigo-950 rounded-lg border border-indigo-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {userGrowthData.summary.totalNewUsers}
                      </div>
                      <div className="text-xs text-indigo-200">
                        New Users ({selectedPeriod})
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">
                        {growthRate}
                      </div>
                      <div className="text-xs text-indigo-200">
                        Growth Rate
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-400">
                        {averageDaily}%
                      </div>
                      <div className="text-xs text-indigo-200">
                        Daily Average Rate
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
      />
    </div>
  );
}