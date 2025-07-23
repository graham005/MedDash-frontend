import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/patient/ems')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div><Outlet /></div>
}

