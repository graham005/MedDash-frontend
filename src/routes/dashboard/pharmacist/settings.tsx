import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/pharmacist/settings"!</div>
}
