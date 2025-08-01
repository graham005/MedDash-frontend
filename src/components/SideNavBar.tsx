import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
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
    ShieldExclamationIcon,
    BanknotesIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { useLogout } from '@/hooks/useAuth';
import { ModeToggle } from './mode-toggle';
import { UserRole } from '@/types/enums';
import { useState } from 'react';

type NavDropdownItem = {
    label: string;
    to: string;
};

type NavItem = {
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    to?: string;
    dropdown?: NavDropdownItem[];
};

const NAV_CONFIG: Record<UserRole, NavItem[]> = {
    admin: [
        { label: "Dashboard", icon: ChartBarIcon, to: "/dashboard/admin" },
        {
            label: "Users",
            icon: UsersIcon,
            dropdown: [
                // { label: "All Users", to: "/dashboard/admin/users" },
                { label: "Patients", to: "/dashboard/admin/users/patients" },
                { label: "Doctors", to: "/dashboard/admin/users/doctors" },
                { label: "Pharmacists", to: "/dashboard/admin/users/pharmacists" },
                { label: "Admins", to: "/dashboard/admin/users/admins" },
            ],
        },
        { label: "EMS Control", icon: ShieldExclamationIcon, to: "/dashboard/admin/ems" },
        { label: "Payments", icon: BanknotesIcon , to: "/dashboard/admin/payments" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/admin/settings" },
    ],
    patient: [
        { label: "Home", icon: HomeIcon, to: "/dashboard/patient" },
        { label: "Appointments", icon: CalendarDaysIcon, to: "/dashboard/patient/appointments" },
        { label: "Prescriptions", icon: ClipboardDocumentIcon, to: "/dashboard/patient/prescriptions" },
        { label: "Orders", icon: TruckIcon, to: "/dashboard/patient/orders" },
        { label: "Messages", icon: ChatBubbleLeftRightIcon, to: "/dashboard/patient/messages" },
        { label: "Emergency", icon: ShieldExclamationIcon, to: "/dashboard/patient/ems" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/patient/settings" },
    ],
    doctor: [
        { label: "Dashboard", icon: ChartBarIcon, to: "/dashboard/doctor" },
        { label: "Availability", icon: UserGroupIcon, to: "/dashboard/doctor/availability" },
        { label: "Appointments", icon: CalendarDaysIcon, to: "/dashboard/doctor/appointments" },
        { label: "Messages", icon: ChatBubbleLeftRightIcon, to: "/dashboard/doctor/messages" },
        { label: "Prescriptions", icon: ClipboardDocumentIcon, to: "/dashboard/doctor/prescriptions" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/doctor/profile" },
    ],
    pharmacist: [
        { label: "Home", icon: HomeIcon, to: "/dashboard/pharmacist" },
        { label: "Inventory", icon: BuildingStorefrontIcon, to: "/dashboard/pharmacist/inventory" },
        { label: "Orders", icon: ClipboardDocumentIcon, to: "/dashboard/pharmacist/orders" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/pharmacist/settings" },
    ],
    paramedic: [
        { label: "Emergency Dashboard", icon: ShieldExclamationIcon, to: "/dashboard/paramedic/ems" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/paramedic/settings" },
    ],
};

export type Role = UserRole;

interface SideNavBarProps {
    role: Role;
}

export default function SideNavBar({ role }: SideNavBarProps) {
    const [usersDropdownOpen, setUsersDropdownOpen] = useState(false);
    if (!role) return null;
    const navItems = NAV_CONFIG[role];
    const { location } = useRouterState();
    const navigate = useNavigate();
    const { mutate: logout, isPending: isLogoutPending } = useLogout();

    return (
        <aside className="fixed left-0 top-0 bg-[#050a2f] text-white w-64 h-screen px-6 py-8 flex flex-col z-40 overflow-y-auto
            dark:bg-slate-900 dark:text-slate-100 transition-colors">
            <div className='flex flex-row justify-between'>
                <div className="mb-8">
                    <div className="text-2xl font-bold text-indigo-200 dark:text-indigo-400">
                        MedDash</div>
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
                    // Dropdown for admin users
                    if (role === "admin" && item.dropdown) {
                        const isAnyActive = item.dropdown.some((d) => location.pathname === d.to) || location.pathname === "/dashboard/admin/users";
                        return (
                            <div key={item.label} className="relative">
                                <div
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium w-full transition cursor-pointer
                                    ${isAnyActive
                                        ? "bg-indigo-900 text-indigo-200 dark:bg-indigo-700 dark:text-white"
                                        : "hover:bg-indigo-800 hover:text-indigo-100 dark:hover:bg-slate-800 dark:hover:text-indigo-200"
                                    }`}
                                    onClick={() => {
                                        navigate({ to: "/dashboard/admin/users" });
                                        setUsersDropdownOpen((open) => !open);
                                    }}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span>{item.label}</span>
                                    <button
                                        type="button"
                                        aria-label="Toggle users dropdown"
                                        className={`ml-auto p-1 rounded transition-colors hover:bg-indigo-800 dark:hover:bg-slate-700`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUsersDropdownOpen((open) => !open);
                                        }}
                                    >
                                        <svg className={`w-4 h-4 transition-transform ${usersDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                </div>
                                {usersDropdownOpen && (
                                    <div className=" mt-1 flex flex-col w-full bg-indigo-950/90 dark:bg-slate-800 rounded shadow z-20">
                                        {item.dropdown.map((d) => (
                                            <Link
                                                key={d.label}
                                                to={d.to}
                                                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-base font-medium transition
                                                    ${location.pathname === d.to
                                                        ? "bg-indigo-900 text-indigo-200 dark:bg-indigo-700 dark:text-white"
                                                        : "hover:bg-indigo-800 hover:text-indigo-100 dark:hover:bg-slate-800 dark:hover:text-indigo-200"
                                                    }`}
                                            >
                                                {d.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    // Normal nav item
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