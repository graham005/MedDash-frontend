import { createFileRoute } from '@tanstack/react-router'
import MessagesPage from '@/components/messaging/MessagesPage';


export const Route = createFileRoute('/dashboard/doctor/messages')({
  component: MessagesPage,
})

