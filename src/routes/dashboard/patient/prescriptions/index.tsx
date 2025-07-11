import PatientPrescriptions from '@/components/patient/Prescriptions'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/prescriptions/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PatientPrescriptions /></div>
}
