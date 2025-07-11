import NewOrder from '@/components/patient/NewOrder'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/orders/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><NewOrder /></div>
}
