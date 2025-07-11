import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/prescriptions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Outlet /></div>
}
