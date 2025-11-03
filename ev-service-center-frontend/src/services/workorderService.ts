import { httpClient } from "@/lib/httpClient";

export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkOrder {
    id: number;
    title: string;
    description: string;
    status: WorkOrderStatus;
    appointmentId: number;
    dueDate?: string;
    totalPrice: number;
    createdById: number;
    createdAt: string;
    updatedAt: string;
}

export interface Vehicle {
    id: number;
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    userId: number;
}

export interface Appointment {
    id: number;
    userId: number;
    serviceCenterId: number;
    vehicleId: number;
    date: string;
    timeSlot: string;
    status: string;
    notes?: string;
    createdById: number;
    createdAt: string;
    updatedAt: string;
}

export interface ChecklistItem {
    id: number;
    workOrderId: number;
    price: number;
    task: string;
    completed: boolean;
    assignedToUserId?: number | null;
    assignedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    
    // Relations
    workOrder?: WorkOrder;
    vehicle?: Vehicle;
    appointment?: Appointment;
    assignedUser?: {
        id: number;
        username: string;
        email: string;
        userRoles: Array<{ role: { name: string } }>;
        createdAt: string;
        updatedAt: string;
    };
}

export interface CreateWorkOrderRequest {
    title: string;
    description: string;
    status?: WorkOrderStatus;
    appointmentId: number;
    dueDate?: string;
    totalPrice: number;
    createdById: number;
}

export interface UpdateWorkOrderRequest {
    title?: string;
    description?: string;
    status?: WorkOrderStatus;
    appointmentId?: number;
    dueDate?: string;
    totalPrice?: number;
}

export interface CreateChecklistItemRequest {
    workOrderId: number;
    price: number;
    task: string;
    completed?: boolean;
    assignedToUserId?: number | null;
    assignedAt?: string | null;
}

export interface UpdateChecklistItemRequest {
    price?: number;
    task?: string;
    completed?: boolean;
    assignedToUserId?: number | null;
    assignedAt?: string | null;
}

export const getAllWorkOrders = async (): Promise<WorkOrder[]> => {
    const res = await httpClient.get('/api/workorder');
    return res.data;
};

export const getWorkOrderById = async (id: number): Promise<WorkOrder> => {
    const res = await httpClient.get(`/api/workorder/${id}`);
    return res.data;
};

export const getWorkOrderByAppointmentId = async (appointmentId: number): Promise<WorkOrder | null> => {
    try {
        const res = await httpClient.get(`/api/workorder/appointment/${appointmentId}`);
        return res.data;
    } catch {
        return null;
    }
};

export const createWorkOrder = async (data: CreateWorkOrderRequest): Promise<WorkOrder> => {
    const res = await httpClient.post('/api/workorder', data);
    return res.data;
};

export const updateWorkOrder = async (id: number, data: UpdateWorkOrderRequest): Promise<WorkOrder> => {
    const res = await httpClient.put(`/api/workorder/${id}`, data);
    return res.data;
};

export const deleteWorkOrder = async (id: number): Promise<void> => {
    await httpClient.delete(`/api/workorder/${id}`);
};

export const addChecklistItem = async (workOrderId: number, data: Omit<CreateChecklistItemRequest, 'workOrderId'>): Promise<ChecklistItem> => {
    const res = await httpClient.post(`/api/workorder/${workOrderId}/checklist`, data);
    return res.data;
};

export const getChecklistItems = async (workOrderId: number): Promise<ChecklistItem[]> => {
    const res = await httpClient.get(`/api/workorder/${workOrderId}/checklist`);
    return res.data;
};

export const getAllChecklistItems = async (params?: {
    page?: number;
    limit?: number;
    keyword?: string;
}): Promise<{
    data: ChecklistItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}> => {
    const res = await httpClient.get('/api/workorder/checklist/all', { params });
    return res.data;
};

export const getChecklistItemById = async (workOrderId: number, itemId: number): Promise<ChecklistItem> => {
    const res = await httpClient.get(`/api/workorder/${workOrderId}/checklist/${itemId}`);
    return res.data;
};

export const updateChecklistItem = async (workOrderId: number, itemId: number, data: UpdateChecklistItemRequest): Promise<ChecklistItem> => {
    const res = await httpClient.put(`/api/workorder/${workOrderId}/checklist/${itemId}`, data);
    return res.data;
};

export const deleteChecklistItem = async (workOrderId: number, itemId: number): Promise<void> => {
    await httpClient.delete(`/api/workorder/${workOrderId}/checklist/${itemId}`);
};
