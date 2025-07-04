import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/hello')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='text-black '>Hello "/dashboard/hello"!</div>
}
