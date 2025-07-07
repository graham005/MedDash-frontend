import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/prescriptions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/pharmacist/prescriptions"!</div>
}
