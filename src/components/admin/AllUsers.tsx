import { useState, useMemo } from "react";
import { useUsers, useUserOperations } from "@/hooks/useUsers";
import { UserRole, UserStatus } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PlusIcon, ArrowDownTrayIcon, PencilIcon, TrashIcon, PauseIcon } from "@heroicons/react/24/outline";

const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: "Admin",
    [UserRole.PATIENT]: "Patient",
    [UserRole.DOCTOR]: "Doctor",
    [UserRole.PHARMACIST]: "Pharmacist",
};

const STATUS_LABELS: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: "Active",
    [UserStatus.PENDING]: "Pending",
    [UserStatus.SUSPENDED]: "Suspended",
};

const ROLE_COLORS: Record<UserRole, string> = {
    admin: "bg-indigo-900 text-white",
    patient: "bg-indigo-100 text-indigo-900",
    doctor: "bg-indigo-800 text-white",
    pharmacist: "bg-indigo-200 text-indigo-900",
};

const STATUS_COLORS: Record<UserStatus, string> = {
    active: "text-indigo-500",
    pending: "text-yellow-500",
    suspended: "text-red-500",
};

const ROLES: { label: string; value: UserRole | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Patient", value: UserRole.PATIENT },
    { label: "Doctor", value: UserRole.DOCTOR },
    { label: "Pharmacist", value: UserRole.PHARMACIST },
    { label: "Admin", value: UserRole.ADMIN },
];

function CreateUserModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userRole: UserRole.PATIENT,
    phoneNumber: "",
    status: UserStatus.ACTIVE,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-lg font-bold mb-4 text-indigo-900 dark:text-white">Add New User</div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              required
              className="flex-1"
            />
            <Input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              required
              className="flex-1"
            />
          </div>
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            name="phoneNumber"
            placeholder="Phone Number"
            value={form.phoneNumber}
            onChange={handleChange}
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <select
            name="userRole"
            value={form.userRole}
            onChange={handleChange}
            className="rounded px-3 py-2 border bg-indigo-50 dark:bg-slate-800 dark:text-white"
            required
          >
            {Object.values(UserRole).map(role => (
              <option key={role} value={role}>{ROLE_LABELS[role]}</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-indigo-700 text-white">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function exportUsersAsCSV(users: any[]) {
  if (!users.length) return;
  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Phone Number",
    "Role",
    "Status"
  ];
  const rows = users.map(u => [
    u.firstName,
    u.lastName,
    u.email,
    u.phoneNumber || "",
    u.userRole,
    u.status || ""
  ]);
  const csvContent =
    [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "users.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AllUsers() {
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [modalOpen, setModalOpen] = useState(false);

    const { data: users = [], isLoading } = useUsers(roleFilter === "all" ? undefined : roleFilter as UserRole);
    const { createUser, deleteUser } = useUserOperations();

    // Simulate stats for demo
    const stats = useMemo(() => ({
        total: users.length,
        newToday: 0,
        active: users.filter(u => u.status === UserStatus.ACTIVE).length || 0,
        pending: users.filter(u => u.status === UserStatus.PENDING).length || 0,
    }), [users]);

    // Filtered users
    const filteredUsers = useMemo(() => {
        let filtered = users;
        if (search) {
            filtered = filtered.filter(u =>
                u.firstName.toLowerCase().includes(search.toLowerCase()) ||
                u.lastName.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
            );
        }
        return filtered;
    }, [users, search]);

    // Pagination
    const pagedUsers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, page]);

    // Export CSV
    const handleExportCSV = () => {
        exportUsersAsCSV(filteredUsers);
        toast.success("Exported users as CSV!");
    };

    // Add new user
    const handleAddUser = () => {
        setModalOpen(true);
    };

    const handleCreateUser = (data: any) => {
        createUser.mutate(data, {
            onSuccess: () => {
                setModalOpen(false);
            },
            onError: (err: any) => {
                toast.error(err?.message || "Failed to create user");
            }
        });
    };

    return (
        <div className="min-h-screen bg- dark:bg-slate-950 py-6 px-2 md:px-8 flex flex-col items-center">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center pb-5 md:justify-between w-full gap-4 px-6 pt-6">
                <div>
                    <div className="text-2xl font-bold text-[#0a1240] dark:text-white">User Management</div>
                </div>
                <div className="flex gap-2 items-center max-w-2xl">
                    <Input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-48 md:w-64 bg-indigo-50 dark:bg-slate-800 dark:text-white"
                    />
                    <Button variant="outline" className="flex gap-2 items-center" onClick={handleExportCSV}>
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Export CSV
                    </Button>
                    <Button className="bg-indigo-700 hover:bg-indigo-900 text-white flex gap-2 items-center" onClick={handleAddUser}>
                        <PlusIcon className="w-5 h-5" />
                        Add New User
                    </Button>
                </div>
            </div>
            <Card className="w-full max-w-7xl bg-white dark:bg-slate-900 rounded-lg shadow-lg border-2 border-transparent">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-6">
                    <div className="bg-[#0a1240] dark:bg-slate-800 rounded-lg p-4 flex flex-col items-start">
                        <div className="text-xs text-indigo-100">Total Users</div>
                        <div className="text-2xl font-bold text-indigo-200 flex items-center gap-2">{stats.total}
                            <span className="inline-block"><UsersIcon className="w-5 h-5 text-indigo-300" /></span>
                        </div>
                    </div>
                    <div className="bg-[#0a1240] dark:bg-slate-800 rounded-lg p-4 flex flex-col items-start">
                        <div className="text-xs text-indigo-100">New Today</div>
                        <div className="text-2xl font-bold text-indigo-200 flex items-center gap-2">{stats.newToday}
                            <span className="inline-block"><UserPlusIcon className="w-5 h-5 text-indigo-300" /></span>
                        </div>
                    </div>
                    <div className="bg-[#0a1240] dark:bg-slate-800 rounded-lg p-4 flex flex-col items-start">
                        <div className="text-xs text-indigo-100">Active Users</div>
                        <div className="text-2xl font-bold text-indigo-200 flex items-center gap-2">{stats.active}
                            <span className="inline-block"><UserGroupIcon className="w-5 h-5 text-indigo-300" /></span>
                        </div>
                    </div>
                    <div className="bg-[#0a1240] dark:bg-slate-800 rounded-lg p-4 flex flex-col items-start">
                        <div className="text-xs text-indigo-100">Pending</div>
                        <div className="text-2xl font-bold text-indigo-200 flex items-center gap-2">{stats.pending}
                            <span className="inline-block"><ClockIcon className="w-5 h-5 text-indigo-300" /></span>
                        </div>
                    </div>
                </div>
                {/* Role Filter */}
                <div className="flex gap-2 px-6 pb-4">
                    {ROLES.map(r => (
                        <Button
                            key={r.value}
                            variant={roleFilter === r.value ? "default" : "outline"}
                            className={`rounded-full px-4 py-1 text-xs font-semibold ${roleFilter === r.value ? "bg-indigo-700 text-white" : "bg-indigo-100 text-indigo-900 dark:bg-slate-800 dark:text-white"}`}
                            onClick={() => setRoleFilter(r.value)}
                        >
                            {r.label}
                        </Button>
                    ))}
                </div>
                {/* Table */}
                <div className="overflow-x-auto px-2 pb-6">
                    <table className="min-w-full rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-[#0a1240] dark:bg-slate-800 text-indigo-100 text-left">
                                <th className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selected.length === pagedUsers.length && pagedUsers.length > 0}
                                        onChange={e => setSelected(e.target.checked ? pagedUsers.map(u => u.id) : [])}
                                    />
                                    <span className="ml-2 text-xs font-semibold">Select All</span>
                                </th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-indigo-500 dark:text-indigo-200">Loading users...</td>
                                </tr>
                            ) : pagedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-indigo-500 dark:text-indigo-200">No users found.</td>
                                </tr>
                            ) : (
                                pagedUsers.map(user => (
                                    <tr key={user.id} className="bg-white dark:bg-slate-900 border-b border-indigo-50 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 transition">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(user.id)}
                                                onChange={e => setSelected(e.target.checked
                                                    ? [...selected, user.id]
                                                    : selected.filter(id => id !== user.id)
                                                )}
                                            />
                                        </td>
                                        <td className="px-4 py-3 flex items-center gap-3">
                                            <img
                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}+${user.lastName}`}
                                                alt={user.firstName}
                                                className="w-8 h-8 rounded-full border border-indigo-200 dark:border-slate-700 object-cover"
                                            />
                                            <div>
                                                <div className="font-semibold text-indigo-900 dark:text-white">{user.firstName} {user.lastName}</div>
                                                <div className="text-xs text-indigo-500 dark:text-indigo-300">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.userRole] || "bg-indigo-100 text-indigo-900"}`}>
                                                {ROLE_LABELS[user.userRole]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-2 text-xs font-semibold ${STATUS_COLORS[user.status || UserStatus.ACTIVE]}`}>
                                                <span className="w-2 h-2 rounded-full inline-block" style={{
                                                    background: user.status === UserStatus.ACTIVE ? "#6366f1" : user.status === UserStatus.PENDING ? "#fbbf24" : "#ef4444"
                                                }} />
                                                {STATUS_LABELS[user.status || UserStatus.ACTIVE]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <Button variant="ghost" size="icon" className="text-indigo-500 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-800">
                                                <PauseIcon className="w-4 h-4" title="Suspend" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-indigo-500 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-800">
                                                <PencilIcon className="w-4 h-4" title="Edit" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-800"
                                                onClick={() => deleteUser.mutate(user.id)}
                                            >
                                                <TrashIcon className="w-4 h-4" title="Delete" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Bulk Actions & Pagination */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 pb-6">
                    <div>
                        <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-200">
                            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                        </span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </Button>
                        {[...Array(Math.ceil(filteredUsers.length / pageSize)).keys()].map(i => (
                            <Button
                                key={i + 1}
                                variant={page === i + 1 ? "default" : "outline"}
                                className="px-3"
                                onClick={() => setPage(i + 1)}
                            >
                                {i + 1}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            disabled={page === Math.ceil(filteredUsers.length / pageSize) || filteredUsers.length === 0}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
            <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateUser} />
        </div>
    );
}

// Icons used in stats
function UsersIcon(props: any) {
    return <svg {...props} fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" fill="currentColor" /><path fill="currentColor" d="M23 20v-2a4 4 0 0 0-3-3.87" /><path fill="currentColor" d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function UserPlusIcon(props: any) {
    return <svg {...props} fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M15 19v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" fill="currentColor" /><path fill="currentColor" d="M19 8v6" /><path fill="currentColor" d="M22 11h-6" /></svg>;
}
function UserGroupIcon(props: any) {
    return <svg {...props} fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" fill="currentColor" /><path fill="currentColor" d="M23 20v-2a4 4 0 0 0-3-3.87" /><path fill="currentColor" d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function ClockIcon(props: any) {
    return <svg {...props} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>;
}