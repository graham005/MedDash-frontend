import PatientHomePage from '@/components/patient/HomePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PatientHomePage /></div>
}
