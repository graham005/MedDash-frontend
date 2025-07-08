import { Outlet } from "@tanstack/react-router"
import SideNavBar, { type Role } from "./SideNavBar"
import { useUserRole } from "@/hooks/useAuth";

function DashboardLayout() {
  const userRole = useUserRole();
  const role: Role = userRole as Role;
  return (
    <div className="flex">
      <SideNavBar role={role} />
      <div className="flex-1 flex flex-col transition-all duration-300 ml-64">
        <Outlet />
      </div>
    </div>
  )
}

export default DashboardLayout