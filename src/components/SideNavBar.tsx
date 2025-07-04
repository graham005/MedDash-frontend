import { Link, useRouterState } from '@tanstack/react-router'
import {
    ChartBarIcon,
    UsersIcon,
    CalendarDaysIcon,
    ClipboardDocumentIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    HomeIcon,
    BuildingStorefrontIcon,
} from "@heroicons/react/24/solid";

const NAV_CONFIG = {
    admin: [
        { label: "Dashboard", icon: ChartBarIcon, to: "/dashboard" },
        { label: "Users", icon: UsersIcon, to: "/users" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/settings" },
    ],
    patient: [
        { label: "Home", icon: HomeIcon, to: "/" },
        { label: "Appointments", icon: CalendarDaysIcon, to: "/appointments" },
        { label: "Prescriptions", icon: ClipboardDocumentIcon, to: "/prescriptions" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/settings" },
    ],
    doctor: [
        { label: "Dashboard", icon: ChartBarIcon, to: "/dashboard" },
        { label: "Patients", icon: UserGroupIcon, to: "/patients" },
        { label: "Appointments", icon: CalendarDaysIcon, to: "/appointments" },
        { label: "Prescriptions", icon: ClipboardDocumentIcon, to: "/prescriptions" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/settings" },
    ],
    pharmacist: [
        { label: "Dashboard", icon: ChartBarIcon, to: "/dashboard" },
        { label: "Prescriptions", icon: ClipboardDocumentIcon, to: "/prescriptions" },
        { label: "Inventory", icon: BuildingStorefrontIcon, to: "/inventory" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/settings" },
    ],
};

export type Role = "admin" | "patient" | "doctor" | "pharmacist";

interface SideNavBarProps {
    role: Role;
}

export default function SideNavBar({ role }: SideNavBarProps) {
    if (!role) return null;
    const navItems = NAV_CONFIG[role];
    const { location } = useRouterState();

    return (
        <aside className="bg-[#050a2f] text-white w-64 min-h-screen px-6 py-8 flex flex-col
            dark:bg-slate-900 dark:text-slate-100 transition-colors">
            <div className="mb-8">
                <div className="text-2xl font-bold text-indigo-200 dark:text-indigo-400">MedDash</div>
                <div className="text-sm text-indigo-100 opacity-70 dark:text-indigo-200 dark:opacity-80">
                    {role.charAt(0).toUpperCase() + role.slice(1)} Portal
                </div>
            </div>
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition
                ${isActive
                                    ? "bg-indigo-900 text-indigo-200 dark:bg-indigo-700 dark:text-white"
                                    : "hover:bg-indigo-800 hover:text-indigo-100 dark:hover:bg-slate-800 dark:hover:text-indigo-200"
                                }
              `}
                        >
                            <item.icon className="w-6 h-6" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}