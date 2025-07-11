import PharmacyOrders from '@/components/patient/PharmacyOrders'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/orders/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PharmacyOrders /></div>
}
