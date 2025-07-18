import {api} from './url';

export interface CreateMessageDto {
  content: string;
  type?: 'text' | 'image' | 'file' | 'prescription' | 'system';
  context: 'appointment' | 'pharmacy_order';
  conversationId: string;
  receiverId: string;
  metadata?: string;
}

export interface MessageResponseDto {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'prescription' | 'system';
  context: 'appointment' | 'pharmacy_order';
  conversationId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  isRead: boolean;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDto {
  id: string;
  context: 'appointment' | 'pharmacy_order';
  participant: {
    id: string;
    name: string;
    role: string;
  };
  appointmentDetails?: {
    startTime: Date;
    endTime: Date;
    status: string;
    reasonForVisit: string;
  };
  orderDetails?: {
    status: string;
    quantity: number;
    totalPrice: number;
    prescription: any;
  };
  lastMessage: MessageResponseDto | null;
  unreadCount: number;
  updatedAt: Date;
}

export interface ConversationsResponseDto {
  appointments: ConversationDto[];
  pharmacyOrders: ConversationDto[];
}

export interface ConversationMessagesResponseDto {
  messages: MessageResponseDto[];
  total: number;
  hasMore: boolean;
}

export const messagingAPI = {
  // Send a message
  sendMessage: async (messageData: CreateMessageDto): Promise<MessageResponseDto> => {
    const response = await api.post('/messaging', messageData);
    return response.data;
  },

  // Get user conversations
  getUserConversations: async (): Promise<ConversationsResponseDto> => {
    const response = await api.get('/messaging/conversations');
    return response.data;
  },

  // Get conversation messages
  getConversationMessages: async (
    context: 'appointment' | 'pharmacy_order',
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ConversationMessagesResponseDto> => {
    const response = await api.get(`/messaging/conversations/${context}/${conversationId}`, {
      params: { page, limit }
    });
    return response.data;
  }
};