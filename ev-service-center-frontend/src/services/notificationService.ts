import { httpClient } from "@/lib/httpClient";

export interface Notification {
    id: number;
    message: string;
    link?: string;
    status: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export interface NotificationResponse {
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface NotificationFilters {
    page?: number;
    limit?: number;
    status?: string;
    userId?: number;
}

export const getAllNotifications = async (): Promise<Notification[]> => {
    const res = await httpClient.get('/api/notification');
    return res.data;
};

export const getNotifications = async (filters?: NotificationFilters): Promise<NotificationResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status !== undefined) params.append('status', filters.status);
    if (filters?.userId) params.append('userId', filters.userId.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/api/notification?${queryString}` : '/api/notification';
    
    const res = await httpClient.get(url);
    return res.data;
};

export const getNotificationById = async (id: number): Promise<Notification> => {
    const res = await httpClient.get(`/notification/${id}`);
    return res.data;
};

export const getNotificationsByUser = async (userId: number): Promise<Notification[]> => {
    const res = await httpClient.get(`/api/notification/user/${userId}`);
    return res.data;
};

export const getUnreadNotifications = async (filters?: NotificationFilters): Promise<NotificationResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.userId) params.append('userId', filters.userId.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/notification/unread?${queryString}` : '/notification/unread';
    
    const res = await httpClient.get(url);
    return res.data;
};

export const createNotification = async (data: {
    message: string;
    link?: string;
    userId: number;
}): Promise<Notification> => {
    const res = await httpClient.post('/api/notification', data);
    return res.data;
};

export const updateNotification = async (id: number, data: {
    message?: string;
    link?: string;
    status?: string;
}): Promise<Notification> => {
    const res = await httpClient.patch(`/notification/${id}`, data);
    return res.data;
};

export const markAsRead = async (id: number): Promise<Notification> => {
    const res = await httpClient.put(`/api/notification/${id}/read`);
    return res.data;
};

export const markAllAsRead = async (): Promise<void> => {
    await httpClient.patch('/notification/read-all');
};

export const deleteNotification = async (id: number): Promise<void> => {
    await httpClient.delete(`/api/notification/${id}`);
};

export interface CreateNotificationDto {
    message: string;
    link?: string;
    userId: number;
}

export interface UpdateNotificationDto {
    message?: string;
    link?: string;
    status?: string;
} 