import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { 
  XMarkIcon, 
  PaperAirplaneIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useConversationMessages, useSendMessage } from '@/hooks/useMessaging';
import { useCurrentUser } from '@/hooks/useAuth';
import {  type MessageResponseDto } from '@/api/messaging';

type MessagingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  context: 'appointment' | 'pharmacy_order';
  conversationId: string;
  participantName: string;
  participantRole: 'doctor' | 'patient' | 'pharmacist';
  appointmentDetails?: {
    startTime: Date;
    endTime: Date;
    status: string;
    reasonForVisit: string;
  };
  receiverId?: string;
}

interface MessageBubbleProps {
  message: MessageResponseDto;
  isOwnMessage: boolean;
}

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div className={cn("flex mb-4", isOwnMessage ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-xs lg:max-w-md", isOwnMessage ? "order-2" : "order-1")}>
        {!isOwnMessage && (
          <div className="flex items-center mb-1">
            <UserCircleIcon className="w-4 h-4 mr-1 text-gray-500" />
            <span className="text-xs text-gray-500">{message.senderName}</span>
          </div>
        )}
        <div
          className={cn(
            "px-4 py-2 rounded-lg",
            isOwnMessage
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none"
          )}
        >
          <p className="text-sm">{message.content}</p>
          <p className={cn("text-xs mt-1", isOwnMessage ? "text-blue-100" : "text-gray-500")}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MessagingModal(props: MessagingModalProps) {
  const {
    isOpen,
    onClose,
    context,
    conversationId,
    participantName,
    participantRole,
    appointmentDetails
  } = props;

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: currentUser } = useCurrentUser();
  const { data: messagesData, isLoading } = useConversationMessages(context, conversationId);
  const sendMessage = useSendMessage();

  const messages = messagesData?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    // Find the participant's user ID
    const receiverId =
      messages.length > 0
        ? messages.find(m => m.senderId !== currentUser.profile?.user?.id)?.senderId || ''
        : props.receiverId || '';

    if (!receiverId) {
      // If no messages yet, we need to determine receiverId based on appointment
      // This would need to be passed as a prop or derived from appointment data
      console.error('Cannot determine receiver ID');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        content: newMessage.trim(),
        context,
        conversationId,
        receiverId,
        type: 'text'
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl h-[600px] bg-white dark:bg-slate-800 flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Message {participantName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {participantRole}
                </Badge>
                {appointmentDetails && (
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(appointmentDetails.startTime), 'MMM d, HH:mm')}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === currentUser?.profile?.user?.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>

        {/* Message Input */}
        <div className="flex-shrink-0 p-4 border-t dark:border-slate-700">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessage.isPending}
              size="sm"
            >
              {sendMessage.isPending ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}