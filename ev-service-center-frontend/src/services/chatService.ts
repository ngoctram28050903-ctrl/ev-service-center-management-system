import { httpClient } from "@/lib/httpClient";

export interface ChatMessage {
    id: number;
    Sender_ID: number;
    Receiver_ID: number;
    Message: string;
    createdAt: string;
    updatedAt: string;
}

export interface SendMessageRequest {
    Sender_ID: number;
    Receiver_ID: number;
    Message: string;
}

export interface ChatHistoryResponse {
    messages: ChatMessage[];
}

export const sendMessage = async (data: SendMessageRequest): Promise<ChatMessage> => {
    const res = await httpClient.post('/api/chat/send', data);
    return res.data;
};

export const getChatHistory = async (user1: number, user2: number): Promise<ChatMessage[]> => {
    const res = await httpClient.get(`/api/chat/history/${user1}/${user2}`);
    return res.data;
};
