import { httpClient } from "@/lib/httpClient";
import { RowData } from "@/types/common";
import { PaginatedVehicleResponse, SearchVehicleDto } from "./userService";

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
    userId: number | null;
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

export const getAllVehicles = async (searchParams?: SearchVehicleDto): Promise<PaginatedVehicleResponse> => {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const res = await httpClient.get(`/api/vehicle?${params.toString()}`);
    return res.data;
};

export const getVehicleById = async (id: number): Promise<Vehicle> => {
    const res = await httpClient.get(`/api/vehicle/${id}`);
    return res.data.data || res.data;
};

export const getVehiclesByUserId = async (userId: number): Promise<Vehicle[]> => {
    const res = await httpClient.get(`/api/vehicle/user/${userId}`);
    return res.data.data || res.data;
};

// Aliases for backward compatibility
export const getVehicles = getAllVehicles;
export const createVehicle = async (data: CreateVehicleRequest): Promise<Vehicle> => {
    const res = await httpClient.post('/api/vehicle/', data);
    return res.data.data || res.data;
};

export const updateVehicle = async (id: number, data: UpdateVehicleRequest): Promise<Vehicle> => {
    const res = await httpClient.put(`/api/vehicle/${id}`, data);
    return res.data.data || res.data;
};

export const deleteVehicle = async (id: number): Promise<void> => {
    await httpClient.delete(`/api/vehicle/${id}`);
};

export const addReminder = async (vehicleId: number, data: CreateReminderRequest): Promise<Reminder> => {
    const res = await httpClient.post(`/api/vehicle/${vehicleId}/reminders`, data);
    return res.data.data || res.data;
};

export const getReminders = async (vehicleId: number): Promise<Reminder[]> => {
    const res = await httpClient.get(`/api/vehicle/${vehicleId}/reminders`);
    return res.data.data || res.data;
};
