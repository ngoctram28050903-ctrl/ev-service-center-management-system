import { httpClient } from "@/lib/httpClient";
import { RowData, User } from "@/types/common"; // Import User từ file common

export interface Vehicle extends RowData {
    id: number;
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    userId: number;
    createdAt?: string;
    updatedAt?: string;
    
    // Relations
    reminders?: Reminder[];
    
    // Index signature to satisfy RowData
    [key: string]: string | number | boolean | null | undefined | Array<unknown> | Record<string, unknown> | object;
}

export interface Reminder {
    id: number;
    vehicleId: number;
    message: string;
    date: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
    
    // Relations
    vehicle?: Vehicle;
}

export interface CreateVehicleRequest {
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    userId: number | null; // (Giữ nguyên, logic form sẽ xử lý)
}

export interface UpdateVehicleRequest {
    licensePlate?: string;
    brand?: string;
    model?: string;
    year?: number;
    userId?: number;
}

export interface CreateReminderRequest {
    vehicleId: number;
    message: string;
    date: string;
}

// SỬA: Interface này phải khớp với backend (vehicle-service)
export interface PaginatedVehicleResponse {
    data: Vehicle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// SỬA: Interface này phải khớp với backend (auth-service)
export interface PaginatedUserResponse {
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}


// --- CÁC HÀM API ĐÃ SỬA (Thêm Generics) ---

export const getAllVehicles = async (searchParams?: {
    keyword?: string;
    userId?: number;
    page?: number;
    limit?: number;
}): Promise<PaginatedVehicleResponse> => {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
        }
      });
    }

    // `httpClient` (Bước 1) trả về: { data: [...], total: ... }
    const res = await httpClient.get<PaginatedVehicleResponse>(`/api/vehicle?${params.toString()}`);
    return res.data;
};

export const getVehicleById = async (id: number): Promise<Vehicle> => {
    // `httpClient` (Bước 1) trả về: response wrapper whose .data is the payload { data: Vehicle }
    const res = await httpClient.get<{ data: Vehicle }>(`/api/vehicle/${id}`);
    return res.data.data;
};

export const getVehiclesByUserId = async (userId: number): Promise<Vehicle[]> => {
    // `httpClient` (Bước 1) trả về: { data: [...] }
    const res = await httpClient.get<{ data: Vehicle[] }>(`/api/vehicle/user/${userId}`);
    return res.data.data;
};

// Aliases for backward compatibility
export const getVehicles = getAllVehicles;

export const createVehicle = async (data: CreateVehicleRequest): Promise<Vehicle> => {
    // `httpClient` (Bước 1) trả về: { data: { id: ..., ... } }
    const res = await httpClient.post<{ data: Vehicle }>('/api/vehicle/', data);
    return res.data.data;
};

export const updateVehicle = async (id: number, data: UpdateVehicleRequest): Promise<Vehicle> => {
    // `httpClient` (Bước 1) trả về: { data: { id: ..., ... } }
    const res = await httpClient.put<{ data: Vehicle }>(`/api/vehicle/${id}`, data);
    return res.data.data;
};

export const deleteVehicle = async (id: number): Promise<{ message: string }> => {
    // `httpClient` (Bước 1) trả về: { message: '...' }
    const res = await httpClient.delete<{ message: string }>(`/api/vehicle/${id}`);
    return res.data;
};

export const addReminder = async (vehicleId: number, data: CreateReminderRequest): Promise<Reminder> => {
    // `httpClient` (Bước 1) trả về: { data: { id: ..., ... } }
    const res = await httpClient.post<{ data: Reminder }>(`/api/vehicle/${vehicleId}/reminders`, data);
    return res.data.data;
};

export const getReminders = async (vehicleId: number, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Reminder>> => {
    // `httpClient` (Bước 1) trả về: { data: [...], total: ... }
    const res = await httpClient.get<PaginatedResponse<Reminder>>(`/api/vehicle/${vehicleId}/reminders`, { params });
    return res.data;
};

// Hàm này gọi auth-service, chúng ta phải sửa nó
export const getAllUsers = async (params?: { page?: number; limit?: number }): Promise<PaginatedUserResponse> => {
    // `httpClient` (Bước 1) trả về: { data: [...], total: ... }
    const res = await httpClient.get<PaginatedUserResponse>('/api/auth/users', { params });
    return res.data;
};

// Helper interface for paginated responses (có thể đưa ra file common)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}