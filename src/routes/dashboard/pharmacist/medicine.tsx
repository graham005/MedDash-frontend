import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/medicine')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/pharmacist/medicine"!</div>
}
