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
    Bars3Icon,
    XMarkIcon,
} from "@heroicons/react/24/solid";
import { useLogout } from '@/hooks/useAuth';
import { ModeToggle } from './mode-toggle';
import { UserRole } from '@/types/enums';
import { useState, useEffect } from 'react';

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
                { label: "Patients", to: "/dashboard/admin/users/patients" },
                { label: "Doctors", to: "/dashboard/admin/users/doctors" },
                { label: "Pharmacists", to: "/dashboard/admin/users/pharmacists" },
                { label: "Admins", to: "/dashboard/admin/users/admins" },
            ],
        },
        { label: "EMS Control", icon: ShieldExclamationIcon, to: "/dashboard/admin/ems" },
        { label: "Payments", icon: BanknotesIcon, to: "/dashboard/admin/payments" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/admin/settings" },
    ],
    patient: [
        { label: "Home", icon: HomeIcon, to: "/dashboard/patient" },
        { label: "Appointments", icon: CalendarDaysIcon, to: "/dashboard/patient/appointments" },
        { label: "Prescriptions", icon: ClipboardDocumentIcon, to: "/dashboard/patient/prescriptions" },
        { label: "Orders", icon: TruckIcon, to: "/dashboard/patient/orders" },
        { label: "Emergency", icon: ShieldExclamationIcon, to: "/dashboard/patient/ems" },
        { label: "Settings", icon: Cog6ToothIcon, to: "/dashboard/patient/settings" },
    ],
    doctor: [
        { label: "Dashboard", icon: ChartBarIcon, to: "/dashboard/doctor" },
        { label: "Availability", icon: UserGroupIcon, to: "/dashboard/doctor/availability" },
        { label: "Appointments", icon: CalendarDaysIcon, to: "/dashboard/doctor/appointments" },
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    if (!role) return null;
    const navItems = NAV_CONFIG[role];
    const { location } = useRouterState();
    const navigate = useNavigate();
    const { mutate: logout, isPending: isLogoutPending } = useLogout();

    // Auto-collapse on mobile and handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            // Auto-close mobile menu on resize
            if (width >= 768) {
                setIsMobileOpen(false);
            }
            // Auto-collapse on tablet sizes
            if (width >= 768 && width < 1024) {
                setIsCollapsed(true);
            } else if (width >= 1024) {
                setIsCollapsed(false);
            }
        };

        // Set initial state
        handleResize();
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileOpen(false);
        setUsersDropdownOpen(false); // Also close dropdowns
    }, [location.pathname]);

    return (
        <>
            {/* Mobile Toggle Button - Enhanced for touch */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="fixed top-3 left-3 z-50 lg:hidden bg-[#050a2f] text-white p-3 rounded-xl shadow-xl dark:bg-slate-900 hover:bg-[#0a1348] dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
                aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            >
                {isMobileOpen ? (
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                    <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
            </button>

            {/* Mobile Overlay - Enhanced */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar - Enhanced responsiveness */}
            <aside
                className={`fixed left-0 top-0 bg-[#050a2f] text-white h-screen flex flex-col z-40 
                    dark:bg-slate-900 dark:text-slate-100 transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-14 sm:w-16 lg:w-20' : 'w-72 sm:w-80 lg:w-64'}
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent
                `}
            >
                {/* Header - Responsive layout */}
                <div className={`flex ${isCollapsed ? 'flex-col items-center py-3' : 'flex-col sm:flex-row justify-between'} p-3 sm:p-4 border-b border-indigo-800/30 dark:border-slate-700/50`}>
                    <div className={`${isCollapsed ? 'text-center' : 'mb-4 sm:mb-0'}`}>
                        <div className={`font-bold text-indigo-200 dark:text-indigo-400 ${isCollapsed ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} transition-all duration-300`}>
                            {isCollapsed ? 'MD' : 'MedDash'}
                        </div>
                        {!isCollapsed && (
                            <div className="text-xs sm:text-sm text-indigo-100 opacity-70 dark:text-indigo-200 dark:opacity-80 mt-1">
                                {role.charAt(0).toUpperCase() + role.slice(1)} Portal
                            </div>
                        )}
                    </div>

                    {/* Desktop Collapse Toggle - Enhanced */}
                    {!isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden lg:flex items-center justify-center p-2 rounded-lg hover:bg-indigo-800 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
                            aria-label="Collapse sidebar"
                        >
                            <Bars3Icon className="w-5 h-5" />
                        </button>
                    )}
                    
                    {/* Expand button for collapsed state */}
                    {isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(false)}
                            className="hidden lg:flex items-center justify-center p-1.5 mt-2 rounded-lg hover:bg-indigo-800 dark:hover:bg-slate-800 transition-all duration-200"
                            aria-label="Expand sidebar"
                        >
                            <Bars3Icon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Navigation - Enhanced spacing and touch targets */}
                <nav className={`flex flex-col gap-1 sm:gap-2 ${isCollapsed ? 'px-1 sm:px-2' : 'px-4 sm:px-6'} flex-1 py-2 sm:py-4`}>
                    {navItems.map((item) => {
                        // Dropdown for admin users - Enhanced for mobile
                        if (role === "admin" && item.dropdown) {
                            const isAnyActive = item.dropdown.some((d) => location.pathname === d.to) || location.pathname === "/dashboard/admin/users";

                            if (isCollapsed) {
                                return (
                                    <div key={item.label} className="relative group">
                                        <div
                                            className={`flex items-center justify-center p-2.5 sm:p-3 lg:p-3.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95
                                                ${isAnyActive
                                                    ? "bg-indigo-900 text-indigo-200 dark:bg-indigo-700 dark:text-white shadow-lg"
                                                    : "hover:bg-indigo-800 hover:text-indigo-100 dark:hover:bg-slate-800 dark:hover:text-indigo-200"
                                                }`}
                                            onClick={() => navigate({ to: "/dashboard/admin/users" })}
                                        >
                                            <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        {/* Enhanced Tooltip */}
                                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                                            {item.label}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={item.label} className="relative">
                                    <div
                                        className={`flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-medium w-full transition-all duration-200 cursor-pointer active:scale-98
                                        ${isAnyActive
                                                ? "bg-indigo-900 text-indigo-200 dark:bg-indigo-700 dark:text-white shadow-lg"
                                                : "hover:bg-indigo-800 hover:text-indigo-100 dark:hover:bg-slate-800 dark:hover:text-indigo-200"
                                            }`}
                                        onClick={() => {
                                            navigate({ to: "/dashboard/admin/users" });
                                            setUsersDropdownOpen((open) => !open);
                                        }}
                                    >
                                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                        <button
                                            type="button"
                                            aria-label="Toggle users dropdown"
                                            className="ml-auto p-1 rounded-md transition-all duration-200 hover:bg-indigo-800 dark:hover:bg-slate-700 active:scale-95"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUsersDropdownOpen((open) => !open);
                                            }}
                                        >
                                            <svg className={`w-4 h-4 transition-transform duration-200 ${usersDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                    {usersDropdownOpen && (
                                        <div className="mt-1 flex flex-col w-full bg-indigo-950/95 dark:bg-slate-800/95 rounded-lg shadow-xl backdrop-blur-sm z-20 border border-indigo-800/30 dark:border-slate-600/30">
                                            {item.dropdown.map((d) => (
                                                <Link
                                                    key={d.label}
                                                    to={d.to}
                                                    className={`flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 active:scale-98
                                                        ${location.pathname === d.to
                                                            ? "bg-indigo-900 text-indigo-200 dark:bg-indigo-700 dark:text-white shadow-md"
                                                            : "hover:bg-indigo-800 hover:text-indigo-100 dark:hover:bg-slate-700 dark:hover:text-indigo-200"
                                                        }`}
                                                >
                                                    <span className="truncate">{d.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Normal nav item - Enhanced
                        const isActive = location.pathname === item.to;

                        if (isCollapsed) {
                            return (
                                <div key={item.label} className="relative group">
                                    <Link
                                        to={item.to}
                                        className={`flex items-center justify-center p-2.5 sm:p-3 lg:p-3.5 rounded-lg transition-all duration-200 active:scale-95
                                            ${isActive
                                                ? "bg-indigo-900 text-indigo-200 dark:bg-indigo-700 dark:text-white shadow-lg"
                                                : "hover:bg-indigo-800 hover:text-indigo-100 dark:hover:bg-slate-800 dark:hover:text-indigo-200"
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </Link>
                                    {/* Enhanced Tooltip */}
                                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                                        {item.label}
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                to={item.to}
                                className={`flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 active:scale-98
                                    ${isActive
                                        ? "bg-indigo-900 text-indigo-200 dark:bg-indigo-700 dark:text-white shadow-lg"
                                        : "hover:bg-indigo-800 hover:text-indigo-100 dark:hover:bg-slate-800 dark:hover:text-indigo-200"
                                    }`}
                            >
                                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Mode Toggle - Enhanced positioning */}
                {!isCollapsed && (
                    <div className="flex justify-start px-4 sm:px-6 pb-3 sm:pb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10">
                            <ModeToggle />
                        </div>
                    </div>
                )}

                {/* Logout Button - Enhanced */}
                <div className={`${isCollapsed ? 'px-1 sm:px-2' : 'px-4 sm:px-6'} pb-4 sm:pb-6 border-t border-indigo-800/30 dark:border-slate-700/50 pt-3 sm:pt-4`}>
                    {isCollapsed ? (
                        <div className="relative group">
                            <button
                                onClick={() => logout()}
                                disabled={isLogoutPending}
                                className="flex items-center justify-center p-2.5 sm:p-3 lg:p-3.5 rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-full active:scale-95 shadow-lg"
                                aria-label="Logout"
                            >
                                <ArrowLeftEndOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            {/* Enhanced Tooltip */}
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                                {isLogoutPending ? "Logging out..." : "Logout"}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => logout()}
                            disabled={isLogoutPending}
                            className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-full active:scale-98 shadow-lg"
                        >
                            <ArrowLeftEndOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                            <span className="truncate">
                                {isLogoutPending ? "Logging out..." : "Logout"}
                            </span>
                        </button>
                    )}
                </div>

                {/* Collapsed Mode Toggle (at bottom) - Enhanced */}
                {isCollapsed && (
                    <div className="px-1 sm:px-2 pb-2 border-t border-indigo-800/30 dark:border-slate-700/50 pt-2">
                        <div className="relative group flex justify-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10">
                                <ModeToggle />
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}