import { useState, useMemo, useEffect } from "react";
import { useUsers, useUserOperations } from "@/hooks/useUsers";
import { UserRole, UserStatus } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PlusIcon, ArrowDownTrayIcon, PencilIcon, TrashIcon, PauseIcon, PlayIcon } from "@heroicons/react/24/outline";

const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: "Admin",
    [UserRole.PATIENT]: "Patient",
    [UserRole.DOCTOR]: "Doctor",
    [UserRole.PHARMACIST]: "Pharmacist",
    [UserRole.PARAMEDIC]: "Paramedic",
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
    paramedic: "bg-indigo-400 text-white",
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
    { label: "Paramedic", value: UserRole.PARAMEDIC },
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

function EditUserModal({ 
  open, 
  onClose, 
  user, 
  onUpdate,
  isUpdating = false // Add this prop
}: { 
  open: boolean; 
  onClose: () => void; 
  user: any; 
  onUpdate: (id: string, data: any) => void;
  isUpdating?: boolean; // Add this prop type
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    userRole: UserRole.PATIENT,
    userStatus: UserStatus.ACTIVE,
  });

  // Update form when user changes or modal opens
  useEffect(() => {
    if (open && user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        userRole: user.userRole || UserRole.PATIENT,
        userStatus: user.userStatus || UserStatus.ACTIVE,
      });
    }
  }, [open, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(user.id, form);
  };

  const handleClose = () => {
    // Reset form when closing
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      userRole: UserRole.PATIENT,
      userStatus: UserStatus.ACTIVE,
    });
    onClose();
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-lg font-bold mb-4 text-indigo-900 dark:text-white">
          Edit User: {user.firstName} {user.lastName}
        </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Role
            </label>
            <select
              name="userRole"
              value={form.userRole}
              onChange={handleChange}
              className="w-full rounded px-3 py-2 border bg-indigo-50 dark:bg-slate-800 dark:text-white"
              required
            >
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Status
            </label>
            <select
              name="userStatus"
              value={form.userStatus}
              onChange={handleChange}
              className="w-full rounded px-3 py-2 border bg-indigo-50 dark:bg-slate-800 dark:text-white"
              required
            >
              {Object.values(UserStatus).map(status => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-indigo-700 hover:bg-indigo-800 text-white"
              disabled={isUpdating} // Use the prop instead
            >
              {isUpdating ? ( // Use the prop instead
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                'Update User'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">{message}</div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            type="button" 
            className={isDestructive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-indigo-700 hover:bg-indigo-800 text-white"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
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
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
      open: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
      isDestructive?: boolean;
    }>({
      open: false,
      title: "",
      message: "",
      onConfirm: () => {},
      isDestructive: false
    });

    const { data: users = [], isLoading, refetch } = useUsers(roleFilter === "all" ? undefined : roleFilter as UserRole);
    const { createUser, deleteUser, updateUser } = useUserOperations();

    // Simulate stats for demo
    const stats = useMemo(() => ({
        total: users.length,
        newToday: 0,
        active: users.filter(u => u.userStatus === UserStatus.ACTIVE).length || 0,
        pending: users.filter(u => u.userStatus === UserStatus.PENDING).length || 0,
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

    // Handle suspend/enable user
    const handleToggleUserStatus = (user: any) => {
      const newStatus = user.userStatus === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
      const action = newStatus === UserStatus.SUSPENDED ? "suspend" : "activate";
      
      setConfirmDialog({
        open: true,
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        message: `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
        onConfirm: () => {
          updateUser.mutate(
            { 
              id: user.id, 
              data: { userStatus: newStatus } 
            },
            {
              onSuccess: () => {
                toast.success(`User ${action}d successfully`);
                refetch();
                setConfirmDialog({ ...confirmDialog, open: false });
              },
              onError: (err: any) => {
                toast.error(err?.message || `Failed to ${action} user`);
                setConfirmDialog({ ...confirmDialog, open: false });
              }
            }
          );
        },
        isDestructive: newStatus === UserStatus.SUSPENDED
      });
    };

    // Handle edit user
    const handleEditUser = (user: any) => {
      console.log('Editing user:', user); // Debug log to see user data
      setEditingUser(user);
      setEditModalOpen(true);
    };

    const handleUpdateUser = (id: string, data: any) => {
      console.log('Updating user with data:', data); // Debug log
      updateUser.mutate(
        { id, data },
        {
          onSuccess: () => {
            toast.success("User updated successfully");
            setEditModalOpen(false);
            setEditingUser(null);
            refetch();
          },
          onError: (err: any) => {
            console.error('Update error:', err);
            toast.error(err?.message || "Failed to update user");
          }
        }
      );
    };

    // Handle delete user
    const handleDeleteUser = (user: any) => {
      setConfirmDialog({
        open: true,
        title: "Delete User",
        message: `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
        onConfirm: () => {
          deleteUser.mutate(user.id, {
            onSuccess: () => {
              toast.success("User deleted successfully");
              refetch();
              setConfirmDialog({ ...confirmDialog, open: false });
            },
            onError: (err: any) => {
              console.error('Delete error:', err);
              toast.error(err?.message || "Failed to delete user");
              setConfirmDialog({ ...confirmDialog, open: false });
            }
          });
        },
        isDestructive: true
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
                                            <span className={`flex items-center gap-2 text-xs font-semibold ${STATUS_COLORS[user.userStatus || UserStatus.ACTIVE]}`}>
                                                <span className="w-2 h-2 rounded-full inline-block" style={{
                                                    background: user.userStatus === UserStatus.ACTIVE ? "#6366f1" : user.userStatus === UserStatus.PENDING ? "#fbbf24" : "#ef4444"
                                                }} />
                                                {STATUS_LABELS[user.userStatus || UserStatus.ACTIVE]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            {/* Suspend/Enable Button */}
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className={`${
                                                user.userStatus === UserStatus.ACTIVE 
                                                  ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-slate-800" 
                                                  : "text-green-500 hover:bg-green-50 dark:hover:bg-slate-800"
                                              }`}
                                              onClick={() => handleToggleUserStatus(user)}
                                              title={user.userStatus === UserStatus.ACTIVE ? "Suspend User" : "Activate User"}
                                            >
                                                {user.userStatus === UserStatus.ACTIVE ? (
                                                  <PauseIcon className="w-4 h-4" />
                                                ) : (
                                                  <PlayIcon className="w-4 h-4" />
                                                )}
                                            </Button>

                                            {/* Edit Button */}
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="text-indigo-500 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-800"
                                              onClick={() => handleEditUser(user)}
                                              title="Edit User"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </Button>

                                            {/* Delete Button */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-800"
                                                onClick={() => handleDeleteUser(user)}
                                                title="Delete User"
                                            >
                                                <TrashIcon className="w-4 h-4" />
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
            {/* Modals */}
            <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreateUser} />
            <EditUserModal 
              open={editModalOpen} 
              onClose={() => {
                setEditModalOpen(false);
                setEditingUser(null);
              }} 
              user={editingUser}
              onUpdate={handleUpdateUser}
              isUpdating={updateUser.isPending} 
            />
            <ConfirmationDialog
              open={confirmDialog.open}
              onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
              onConfirm={confirmDialog.onConfirm}
              title={confirmDialog.title}
              message={confirmDialog.message}
              isDestructive={confirmDialog.isDestructive}
            />
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