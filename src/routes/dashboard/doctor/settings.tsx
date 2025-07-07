import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/doctor/settings"!</div>
}
