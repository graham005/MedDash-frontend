import EditDoctorProfile from '@/components/doctor/profile/EditProfile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/profile/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>< EditDoctorProfile /></div>
}
