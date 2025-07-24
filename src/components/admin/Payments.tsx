import { useState } from "react";
import { usePayments } from "@/hooks/usePayments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar, RotateCcw, Eye } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "@tanstack/react-router";

function getInitials(name: string) {
  if (!name) return "NA";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const statusColors: Record<string, string> = {
  paid: "bg-indigo-200 text-indigo-900",
  pending: "bg-blue-900 text-white",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-blue-900 text-white",
};

export default function Payments() {
  const { data: payments = [], isLoading } = usePayments();
  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState<"all" | "appointment" | "pharmacy_order">("all");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const navigate = useNavigate();

  // Filter logic
  const filteredPayments = payments.filter((p: any) => {
    const fullName = p.fullName?.toLowerCase() || "";
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesType = serviceType === "all" || p.type === serviceType;
    const matchesDate = !date || format(new Date(p.createdAt), "yyyy-MM-dd") === date;
    return matchesSearch && matchesType && matchesDate;
  });

  // Pagination logic
  const paginatedPayments = filteredPayments.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Revenue calculations
  const totalRevenue = payments.filter((p: any) => p.status === "success").reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const pendingRevenue = payments.filter((p: any) => p.status === "pending").reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const refundedRevenue = payments.filter((p: any) => p.status === "refunded").reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Patient Name", "Service Type", "Amount", "Status", "Date"];
    const rows = filteredPayments.map((p: any) => [
      p.fullName,
      p.type === "appointment" ? "Consultation" : "Prescription",
      `KES KES {Number(p.amount).toFixed(2)}`,
      p.status.charAt(0).toUpperCase() + p.status.slice(1),
      format(new Date(p.createdAt), "yyyy-MM-dd"),
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100">
      <div className="bg-[#0a1557] text-white px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payment History</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-indigo-200 dark:bg-indigo-700 border-0 shadow-md">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <span className="text-sm text-indigo-900 dark:text-indigo-100">Total Revenue</span>
                <div className="text-3xl font-bold text-indigo-900 dark:text-white">KES {totalRevenue.toLocaleString()}</div>
              </div>
              <span className="bg-indigo-300 dark:bg-indigo-900 rounded-full p-2 pl-4 pr-4">
                <span className="sr-only">Revenue</span> <b className="text-4xl text-indigo-900">$</b>  
              </span>
            </CardContent>
          </Card>
          <Card className="bg-blue-900 border-0 shadow-md">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <span className="text-sm text-blue-100">Pending</span>
                <div className="text-3xl font-bold text-white">KES {pendingRevenue.toLocaleString()}</div>
              </div>
              <span className="bg-blue-800 rounded-full p-3">
                <Calendar className="w-6 h-6 text-white" />
              </span>
            </CardContent>
          </Card>
          <Card className="bg-blue-900 border-0 shadow-md">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <span className="text-sm text-blue-100">Refunded</span>
                <div className="text-3xl font-bold text-white">KES {refundedRevenue.toLocaleString()}</div>
              </div>
              <span className="bg-blue-800 rounded-full p-3">
                <RotateCcw className="w-6 h-6 text-white" />
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <Button
              variant={serviceType === "all" ? "default" : "outline"}
              className={serviceType === "all" ? "bg-blue-900 text-white" : ""}
              onClick={() => setServiceType("all")}
            >All</Button>
            <Button
              variant={serviceType === "appointment" ? "default" : "outline"}
              className={serviceType === "appointment" ? "bg-blue-900 text-white" : ""}
              onClick={() => setServiceType("appointment")}
            >Consultation</Button>
            <Button
              variant={serviceType === "pharmacy_order" ? "default" : "outline"}
              className={serviceType === "pharmacy_order" ? "bg-blue-900 text-white" : ""}
              onClick={() => setServiceType("pharmacy_order")}
            >Prescription</Button>
          </div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          />
          <Button variant="outline" onClick={() => { setSearch(""); setServiceType("all"); setDate(""); }}>
            Reset
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100">
                <th className="py-3 px-4 text-left">Patient Name</th>
                <th className="py-3 px-4 text-left">Service Type</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-indigo-400">Loading payments...</td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-indigo-400">No payments found.</td>
                </tr>
              ) : (
                paginatedPayments.map((p: any) => (
                  <tr key={p.id} className={p.status === "failed" ? "bg-red-50 dark:bg-red-950" : ""}>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-700 text-indigo-900 dark:text-white font-bold">
                        {getInitials(p.fullName)}
                      </span>
                      <span>{p.fullName}</span>
                    </td>
                    <td className="py-3 px-4">
                      {p.type === "appointment" ? "Consultation" : "Prescription"}
                    </td>
                    <td className="py-3 px-4">KES {Number(p.amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold KES {statusColors[p.status] || "bg-gray-200 text-gray-700"}`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{format(new Date(p.createdAt), "yyyy-MM-dd")}</td>
                    <td className="py-3 px-4 relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-900 dark:text-indigo-100"
                        onClick={() => setActionMenuOpen(p.id === actionMenuOpen ? null : p.id)}
                      >
                        ...
                      </Button>
                      {actionMenuOpen === p.id && (
                        <div className="absolute right-0 z-10 mt-2 w-36 bg-white dark:bg-slate-900 rounded shadow border border-gray-200 dark:border-gray-700">
                          <button
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900 text-left"
                            onClick={() => {
                              setActionMenuOpen(null);
                              navigate({ to: `/dashboard/admin/payments/${p.id}` });
                            }}
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700">
            <div>
              Rows per page:{" "}
              <select
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
              >
                {[10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                &lt;
              </Button>
              {[...Array(Math.ceil(filteredPayments.length / rowsPerPage)).keys()].map(n => (
                <Button
                  key={n + 1}
                  variant={page === n + 1 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPage(n + 1)}
                  className={page === n + 1 ? "bg-indigo-200 dark:bg-indigo-700 text-indigo-900 dark:text-white" : ""}
                >
                  {n + 1}
                </Button>
              ))}
              <Button variant="ghost" size="sm" disabled={page === Math.ceil(filteredPayments.length / rowsPerPage) || filteredPayments.length === 0} onClick={() => setPage(page + 1)}>
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}