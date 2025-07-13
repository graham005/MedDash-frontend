import EditPatientProfile from '@/components/patient/profile/EditProfile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/profile/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><EditPatientProfile /></div>
}
