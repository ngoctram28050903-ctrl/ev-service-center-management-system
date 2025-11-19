import { httpClient } from "@/lib/httpClient";

export interface UserRole {
    id: string;
    userId: string;
    roleId: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
    role?: {
        id: string;
        name: string;
    };
}

export const getUserRoles = async (): Promise<UserRole[]> => {
    const res = await httpClient.get('/user-roles');
    return res.data;
};

export const getUserRoleById = async (id: string): Promise<UserRole> => {
    const res = await httpClient.get(`/user-roles/${id}`);
    return res.data;
};

export const getUserRolesByUserId = async (userId: string): Promise<UserRole[]> => {
    const res = await httpClient.get(`/user-roles/user/${userId}`);
    return res.data;
};

export const createUserRole = async (data: {
    userId: string;
    roleId: string;
}): Promise<UserRole> => {
    const res = await httpClient.post('/user-roles', data);
    return res.data;
};

export const updateUserRole = async (id: string, data: {
    userId?: string;
    roleId?: string;
}): Promise<UserRole> => {
    const res = await httpClient.patch(`/user-roles/${id}`, data);
    return res.data;
};

export const deleteUserRole = async (id: string): Promise<void> => {
    await httpClient.delete(`/user-roles/${id}`);
};

export interface CreateUserRoleDto {
    userId: string;
    roleId: string;
}

export interface UpdateUserRoleDto {
    userId?: string;
    roleId?: string;
} 