import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <Outlet />
    </div>
}
