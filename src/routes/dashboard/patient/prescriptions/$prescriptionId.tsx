import PrescriptionDetails from '@/components/patient/PrescriptionDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/dashboard/patient/prescriptions/$prescriptionId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PrescriptionDetails /></div>
}
