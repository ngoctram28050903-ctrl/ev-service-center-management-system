import { httpClient } from "@/lib/httpClient";
import { User } from "@/types/common";
import { Vehicle } from "./appointmentService";

export interface SearchUserDto {
  name?: string;
  username?: string;
  code?: string;
  email?: string;
  phone?: string;
  role?: string;
  facultyId?: number;
  departmentId?: number;
  majorId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  roles?: string[];
}

export interface SearchVehicleDto {
  keyword?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedVehicleResponse {
  data: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
export interface PaginatedUserResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  roles: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  roles?: string;
}

export const getUsers = async (searchParams?: SearchUserDto): Promise<PaginatedUserResponse> => {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    if (!searchParams?.page) params.set('page', '1');
    if (!searchParams?.limit) params.set('limit', '10');
    const queryString = params.toString();
    const url = queryString ? `/api/auth/users?${queryString}` : '/api/auth/users';
    const res = await httpClient.get(url);
    // Backend returns array; wrap into paginated shape if needed
    if (Array.isArray(res.data)) {
      return { data: res.data, total: res.data.length, page: 1, limit: res.data.length, totalPages: 1, hasNext: false, hasPrev: false } as unknown as PaginatedUserResponse;
    }
    return res.data;
};

export const getUserById = async (id: string): Promise<User> => {
    const res = await httpClient.get(`/api/auth/users/${id}`);
    return res.data;
};

export const createUser = async (data: CreateUserDto): Promise<User> => {
    // Convert single role to array for backend
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      roles: [data.roles], // Convert single role to array
    };
    const res = await httpClient.post('/api/auth/users', payload);
    return res.data;
};

export const updateUser = async (id: string, data: UpdateUserDto): Promise<User> => {
    const payload: Record<string, unknown> = {};
    if (data?.username !== undefined) payload.username = data.username;
    if (data?.email !== undefined) payload.email = data.email;
    if (data?.password) payload.password = data.password;
    if (data?.roles) payload.roles = [data.roles]; // Convert single role to array
    const res = await httpClient.patch(`/api/auth/users/${id}`, payload);
    return res.data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await httpClient.delete(`/api/auth/users/${id}`)
}
