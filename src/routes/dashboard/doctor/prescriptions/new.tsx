import NewPrescription from '@/components/doctor/NewPrescription'
import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/prescriptions/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate({ to: '/dashboard/doctor/prescriptions' });
  };

  return <div className='flex'><NewPrescription onClose={handleClose} /></div>
}
