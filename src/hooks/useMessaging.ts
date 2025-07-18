import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagingAPI, type CreateMessageDto } from '@/api/messaging';
import { toast } from 'sonner';

export function useUserConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: messagingAPI.getUserConversations,
  });
}

export function useConversationMessages(
  context: 'appointment' | 'pharmacy_order',
  conversationId: string,
  page: number = 1,
  limit: number = 50
) {
  return useQuery({
    queryKey: ['conversation-messages', context, conversationId, page],
    queryFn: () => messagingAPI.getConversationMessages(context, conversationId, page, limit),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messagingAPI.sendMessage,
    onSuccess: (data) => {
      // Invalidate and refetch conversation messages
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages', data.context, data.conversationId]
      });
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: ['conversations']
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send message');
    },
  });
}