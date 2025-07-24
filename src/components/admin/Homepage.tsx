import { useRef, useEffect, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { usePayments } from "@/hooks/usePayments";
import { UserStatus } from "@/types/enums";
import { useUpdateUser } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, ExclamationTriangleIcon, UserIcon, BellIcon } from "@heroicons/react/24/solid";
import { Chart, type ChartItem } from "chart.js/auto";
import type { User } from "@/api/user";

// Mock data for activities, alerts, and user growth
const mockAlerts = [
  { id: 1, message: "Payment gateway downtime detected", severity: "critical", time: "5 min ago" },
  { id: 2, message: "Unusual login attempt", severity: "warning", time: "15 min ago" },
  { id: 3, message: "New user registered", severity: "info", time: "1 hour ago" }
];

const mockActivities = [
  { id: 1, activity: "User John Doe logged in", time: "2 min ago", icon: <UserIcon className="w-4 h-4 text-blue-400" /> },
  { id: 2, activity: "Payment processed for Jane Smith", time: "10 min ago", icon: <CheckCircleIcon className="w-4 h-4 text-green-500" /> },
  { id: 3, activity: "User Mike Brown updated profile", time: "30 min ago", icon: <BellIcon className="w-4 h-4 text-yellow-500" /> }
];

const userGrowthData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  datasets: [
    {
      label: "Users",
      data: [120, 150, 180, 220, 260, 300, 350],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      tension: 0.4,
      fill: true
    }
  ]
};

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
      type: 'line',
      data: data,
      options: {
        ...options,
        responsive: true,
        maintainAspectRatio: false
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

export default function Homepage() {
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const { data: payments = [], isLoading: isLoadingPayments } = usePayments();
  const updateUser = useUpdateUser();
  const [search, setSearch] = useState("");


  // Calculate total revenue from payments
  const totalRevenue = payments?.reduce(
    (sum, p) => p.status === "success" ? sum + Number(p.amount) : sum,
    0
  );

  // Top cards data
  const activeUsers = users.filter(u => u.userStatus === UserStatus.ACTIVE).length;
  const alertsCount = mockAlerts.length;
  const uptime = "99.9%";

  // User status toggle handler
  const handleToggleStatus = (user: User) => {
    const newStatus = user.userStatus === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    updateUser.mutate({ id: user.id, userData: { userStatus: newStatus } });
  };

  // Filter users by search
  const filteredUsers = users.filter(
    u =>
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050a2f] text-white flex">
      {/* SideNavBar is already implemented */}
      <main className="flex-1 p-8 ">
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-xs text-indigo-200 mb-2">Active Users</span>
              <span className="text-3xl font-bold text-white">{activeUsers}</span>
            </CardContent>
          </Card>
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-xs text-indigo-200 mb-2">Alerts</span>
              <span className="text-3xl font-bold text-white">{alertsCount}</span>
            </CardContent>
          </Card>
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-xs text-indigo-200 mb-2">Total Revenue</span>
              <span className="text-3xl font-bold text-white">KES {totalRevenue?.toLocaleString() || 0}</span>
            </CardContent>
          </Card>
          <Card className="bg-[#0a1557] border-0 shadow-md">
            <CardContent className="flex flex-col items-start py-6">
              <span className="text-xs text-indigo-200 mb-2">Uptime</span>
              <span className="text-3xl font-bold text-white">{uptime}</span>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Real-Time Activity & User Management */}
          <div className="md:col-span-2 flex flex-col gap-8">
            {/* Real-Time Activity */}
            <Card className="bg-[#0a1557] border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-white">Real-Time Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Button variant="ghost" className="text-indigo-200">All</Button>
                  <Button variant="ghost" className="text-indigo-200">Logins</Button>
                  <Button variant="ghost" className="text-indigo-200">Audits</Button>
                </div>
                <ul>
                  {mockActivities.map((activity) => (
                    <li key={activity.id} className="flex items-center gap-3 py-2 border-b border-indigo-900 last:border-b-0">
                      {activity.icon}
                      <span className="text-sm text-white">{activity.activity}</span>
                      <span className="ml-auto text-xs text-indigo-300">{activity.time}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card className="bg-[#0a1557] border-0 shadow-md">
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
                        filteredUsers.slice(0, 10).map(user => (
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
                                className={user.userStatus === UserStatus.ACTIVE ? "text-red-500 border-red-500" : "bg-green-600 text-white"}
                                onClick={() => handleToggleStatus(user)}
                                disabled={updateUser.isPending || !user.userStatus}
                              >
                                {user.userStatus === UserStatus.ACTIVE ? "Disable" : "Enable"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="text-indigo-200 text-xs mt-2">
                    Showing 1-{Math.min(filteredUsers.length, 10)} of {filteredUsers.length} users
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Critical Alerts, User Growth, Feature Usage */}
          <div className="flex flex-col gap-8">
            {/* Critical Alerts */}
            <Card className="bg-[#0a1557] border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-white">Critical Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul>
                  {mockAlerts.map((alert) => (
                    <li key={alert.id} className="mb-4 p-3 rounded bg-indigo-950 text-white shadow">
                      <span className={`font-bold mr-2 ${
                        alert.severity === "critical"
                          ? "text-red-400"
                          : alert.severity === "warning"
                          ? "text-yellow-300"
                          : "text-blue-300"
                      }`}>{alert.severity.toUpperCase()}</span>
                      {alert.message}
                      <div className="text-xs text-indigo-300 mt-1">{alert.time}</div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* User Growth Chart */}
            <Card className="bg-[#0a1557] border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-white">User Growth</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <UserGrowthChart
                  data={userGrowthData}
                  options={{
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#0a1557',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        borderColor: '#1e40af',
                        borderWidth: 1,
                      }
                    },
                    scales: { 
                      x: { 
                        grid: { color: "#1e293b" },
                        ticks: { color: "#94a3b8" }
                      }, 
                      y: { 
                        grid: { color: "#1e293b" },
                        ticks: { color: "#94a3b8" }
                      } 
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Feature Usage Placeholder */}
            <Card className="bg-[#0a1557] border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-white">Feature Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-indigo-200 text-center py-12">Feature usage analytics coming soon...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}