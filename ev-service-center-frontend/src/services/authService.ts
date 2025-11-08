import { httpClient } from "@/lib/httpClient";

export interface User {
    id: number;
    email: string;
    username?: string;
    password?: string;
    createdAt: string;
    updatedAt: string;
    userRoles?: Array<{
        role: {
            name: string;
        };
    }>;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface RegisterResponse {
    message: string;
    user: User;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: User;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    token: string;
}

export interface UserListResponse {
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface UserListParams {
    name?: string;
    username?: string;
    email?: string;
    role?: string;
    page?: number;
    limit?: number;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    roles?: string[];
}

export interface UpdateUserRequest {
    username?: string;
    email?: string;
    password?: string;
    roles?: string[];
}

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
    const res = await httpClient.post('/api/auth/register', data);
    return res.data;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await httpClient.post('/api/auth/login', data);
    return res.data;
};

export const refreshToken = async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const res = await httpClient.post('/api/auth/refresh', data);
    return res.data;
};

export const getAllUsers = async (params?: UserListParams): Promise<UserListResponse> => {
    const res = await httpClient.get('/api/auth/users', { params });
    return res.data;
};

export const getUserById = async (id: number): Promise<User> => {
    const res = await httpClient.get(`/api/auth/users/${id}`);
    return res.data;
};

export const createUser = async (data: CreateUserRequest): Promise<User> => {
    const res = await httpClient.post('/api/auth/users', data);
    return res.data;
};

export const updateUser = async (id: number, data: UpdateUserRequest): Promise<User> => {
    const res = await httpClient.put(`/api/auth/users/${id}`, data);
    return res.data;
};

export const deleteUser = async (id: number): Promise<void> => {
    await httpClient.delete(`/api/auth/users/${id}`);
};
