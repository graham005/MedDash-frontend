import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/inventory')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/pharmacist/inventory"!</div>
}
