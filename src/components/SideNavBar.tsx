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
    ArrowLeftEndOnRectangleIcon,
    TruckIcon,
} from "@heroicons/react/24/solid";
import { useLogout } from '@/hooks/useAuth';
import { ModeToggle } from './mode-toggle';

const NAV_CONFIG = {
    admin: [
        { label: "Dashboard", icon: ChartBarIcon, to: "/dashboard/admin" },
        { label: "Users", icon: UsersIcon, to: "/dashboard/admin/users" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/admin/settings" },
    ],
    patient: [
        { label: "Home", icon: HomeIcon, to: "/dashboard/patient" },
        { label: "Appointments", icon: CalendarDaysIcon, to: "/dashboard/patient/appointments" },
        { label: "Prescriptions", icon: ClipboardDocumentIcon, to: "/dashboard/patient/prescriptions" },
        { label: "Orders", icon: TruckIcon, to: "/dashboard/patient/orders" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/patient/settings" },
    ],
    doctor: [
        { label: "Dashboard", icon: ChartBarIcon, to: "/dashboard/doctor" },
        { label: "Availability", icon: UserGroupIcon, to: "/dashboard/doctor/availability" },
        { label: "Appointments", icon: CalendarDaysIcon, to: "/dashboard/doctor/appointments" },
        { label: "Prescriptions", icon: ClipboardDocumentIcon, to: "/dashboard/doctor/prescriptions" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/doctor/settings" },
    ],
    pharmacist: [
        { label: "Home", icon: HomeIcon, to: "/dashboard/pharmacist" },
        { label: "Inventory", icon: BuildingStorefrontIcon, to: "/dashboard/pharmacist/inventory" },
        { label: "Orders", icon: ClipboardDocumentIcon, to: "/dashboard/pharmacist/orders" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/pharmacist/settings" },
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
    const { mutate: logout, isPending: isLogoutPending } = useLogout();

    return (
        <aside className="fixed left-0 top-0 bg-[#050a2f] text-white w-64 h-screen px-6 py-8 flex flex-col z-40 overflow-y-auto
            dark:bg-slate-900 dark:text-slate-100 transition-colors">
            <div className='flex flex-row justify-between'>
                <div className="mb-8">
                    <div className="text-2xl font-bold text-indigo-200 dark:text-indigo-400">MedDash</div>
                    <div className="text-sm text-indigo-100 opacity-70 dark:text-indigo-200 dark:opacity-80">
                        {role.charAt(0).toUpperCase() + role.slice(1)} Portal
                    </div>
                </div>
                <div className='w-2 h-2 m-4 mt-2 '>
                    <ModeToggle />
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
            <button
                onClick={() => logout()}
                disabled={isLogoutPending}
                className='mt-8 flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition bg-indigo-800 hover:bg-indigo-900 text-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-indigo-200'
            >
                <ArrowLeftEndOnRectangleIcon className='w-6 h-6' />
                {isLogoutPending ? "Logging out..." : "Logout"}
            </button>
        </aside>
    );
}