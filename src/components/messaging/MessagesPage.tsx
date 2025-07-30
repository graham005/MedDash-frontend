import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUserConversations } from '@/hooks/useMessaging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import MessagingModal from './MessagingModal';

export default function MessagesPage() {
  const { data, isLoading } = useUserConversations();
  const [openConversation, setOpenConversation] = useState<null | string>(null);
  const navigate = useNavigate();

  // Flatten all started conversations (appointments and pharmacy orders)
  const conversations = [
    ...(data?.appointments || []),
    ...(data?.pharmacyOrders || []),
  ].filter(conv => conv.lastMessage); // Only show conversations that have messages

  // Find the selected conversation object
  const selectedConv = conversations.find(conv => conv.id === openConversation);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card >
        <CardHeader >
          <CardTitle className="text-xl font-bold ">Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No conversations yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-slate-700">
              {conversations.map((conv) => (
                <li
                  key={conv.id}
                  className="py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 px-2 rounded transition"
                  onClick={() => setOpenConversation(conv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {conv.participant.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {conv.lastMessage?.content?.slice(0, 40) || ''}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {conv.updatedAt
                        ? format(new Date(conv.updatedAt), 'MMM d, HH:mm')
                        : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {/* Messaging Modal */}
      {selectedConv && (
        <MessagingModal
          isOpen={true}
          onClose={() => setOpenConversation(null)}
          context={selectedConv.context as 'appointment' | 'pharmacy_order'}
          conversationId={selectedConv.id}
          participantName={selectedConv.participant.name}
          participantRole={selectedConv.participant.role as 'doctor' | 'patient' | 'pharmacist'}
          receiverId={selectedConv.participant.id}
        />
      )}
    </div>
  );
}