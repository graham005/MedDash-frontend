import PrescriptionDetails from '@/components/doctor/PrescriptionDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/dashboard/doctor/prescriptions/$prescriptionId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PrescriptionDetails /></div>
}
