import PatientProfile from '@/components/patient/profile/Profile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PatientProfile /></div>
}
