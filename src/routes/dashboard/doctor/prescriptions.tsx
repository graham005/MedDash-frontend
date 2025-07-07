import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/prescriptions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/doctor/prescriptions"!</div>
}
