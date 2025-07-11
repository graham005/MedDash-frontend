import PatientOrderDetails from '@/components/patient/OrderDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/orders/$orderId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PatientOrderDetails /></div>
}
