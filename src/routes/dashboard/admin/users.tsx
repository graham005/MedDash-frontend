import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/admin/users')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/admin/users"!</div>
}
