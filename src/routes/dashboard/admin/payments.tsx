import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/admin/payments')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Outlet /></div>
}
