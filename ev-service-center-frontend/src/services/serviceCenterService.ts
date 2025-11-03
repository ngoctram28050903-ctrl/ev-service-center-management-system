import { httpClient } from '@/lib/httpClient';
import { RowData } from '@/types/common';

export interface ServiceCenter extends RowData {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateServiceCenterDto {
    name: string;
    address: string;
    phone: string;
    email?: string;
}

export interface UpdateServiceCenterDto {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
}

export interface SearchServiceCenterDto {
    keyword?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedServiceCenterResponse {
    data: ServiceCenter[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export const getAllServiceCenters = async (searchParams?: SearchServiceCenterDto): Promise<PaginatedServiceCenterResponse> => {
    const params = new URLSearchParams();
    if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
    }
    const response = await httpClient.get(`/api/service-center?${params.toString()}`);
    return response.data;
};

export const getServiceCenterById = async (id: number): Promise<ServiceCenter> => {
    const response = await httpClient.get(`/api/service-center/${id}`);
    return response.data;
};

export const createServiceCenter = async (data: CreateServiceCenterDto): Promise<ServiceCenter> => {
    const response = await httpClient.post('/api/service-center', data);
    return response.data;
};

export const updateServiceCenter = async (id: number, data: UpdateServiceCenterDto): Promise<ServiceCenter> => {
    const response = await httpClient.put(`/api/service-center/${id}`, data);
    return response.data;
};

export const deleteServiceCenter = async (id: number): Promise<void> => {
    await httpClient.delete(`/api/service-center/${id}`);
};