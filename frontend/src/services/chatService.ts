import api from './api';
import { ChatMessage, Conversation } from '../types';

export const chatService = {
  async sendMessage(
    message: string,
    conversationId?: string | null,
    documentId?: string | null
  ): Promise<{ conversation_id: string; message: ChatMessage }> {
    const res = await api.post('/chat', {
      message,
      conversation_id: conversationId || undefined,
      document_id: documentId || undefined,
    });
    return res.data;
  },

  async getHistory(): Promise<Conversation[]> {
    const res = await api.get<Conversation[]>('/chat/history');
    return res.data;
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const res = await api.get<ChatMessage[]>(`/chat/${conversationId}`);
    return res.data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/chat/${conversationId}`);
  }
};
