import { Outlet } from "@tanstack/react-router"
import SideNavBar from "./SideNavBar"

function DashboardLayout() {
  return (
    <div className="flex">
        <SideNavBar role="pharmacist"/>
        <Outlet />
    </div>
  )
}

export default DashboardLayout