import { httpClient } from '@/lib/httpClient';
import { RowData } from '@/types/common';

export interface Appointment extends RowData {
  id: number;
  userId: number;
  createdById: number;
  serviceCenterId: number;
  vehicleId?: number;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  serviceCenter?: ServiceCenter;
  vehicle?: Vehicle;
  user?: User;
  createdBy?: User;
}

export interface ServiceCenter {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentDto {
  createdById: number;
  serviceCenterId: number;
  vehicleId?: number;
  date: string;
  timeSlot: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface UpdateAppointmentDto {
  serviceCenterId?: number;
  vehicleId?: number;
  date?: string;
  timeSlot?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export const getAllAppointments = async (): Promise<Appointment[]> => {
  const response = await httpClient.get('/api/booking');
  return response.data.data || response.data;
};

export const getAppointmentsByUserId = async (userId: number): Promise<Appointment[]> => {
  const response = await httpClient.get(`/api/booking/user/${userId}`);
  return response.data.data || response.data;
};

export const getAppointmentById = async (id: number): Promise<Appointment> => {
  const response = await httpClient.get(`/api/booking/${id}`);
  return response.data.data || response.data;
};

export const createAppointment = async (data: CreateAppointmentDto): Promise<Appointment> => {
  const response = await httpClient.post('/api/booking', data);
  return response.data.data || response.data;
};

export const updateAppointment = async (id: number, data: UpdateAppointmentDto): Promise<Appointment> => {
  const response = await httpClient.put(`/api/booking/${id}`, data);
  return response.data.data || response.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
  await httpClient.delete(`/api/booking/${id}`);
};

// Service Center API calls
export const getAllServiceCenters = async (): Promise<ServiceCenter[]> => {
  const response = await httpClient.get('/api/service-center');
  return response.data.data || response.data;
};

export const getServiceCenterById = async (id: number): Promise<ServiceCenter> => {
  const response = await httpClient.get(`/api/service-center/${id}`);
  return response.data.data || response.data;
};
