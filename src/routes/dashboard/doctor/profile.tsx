import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Outlet /></div>
}
