import CreateDoctorProfile from '@/components/doctor/profile/CreateProfile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/profile/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <CreateDoctorProfile isOpen={true} onClose={() => {}} />
    </div>
  )
}
