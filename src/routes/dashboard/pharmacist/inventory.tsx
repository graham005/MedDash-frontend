import MedicineInventory from '@/components/pharmacist/Medicine'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/inventory')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><MedicineInventory /></div>
}
