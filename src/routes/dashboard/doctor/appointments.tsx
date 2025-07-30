import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/appointments')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Outlet /></div>
}
