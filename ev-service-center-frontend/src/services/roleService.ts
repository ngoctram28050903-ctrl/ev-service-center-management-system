import { httpClient } from "@/lib/httpClient";

export interface Role {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export const getRoles = async (): Promise<Role[]> => {
    const res = await httpClient.get('/roles');
    return res.data;
};

export const getRoleById = async (id: string): Promise<Role> => {
    const res = await httpClient.get(`/roles/${id}`);
    return res.data;
};

export const createRole = async (data: {
    name: string;
}): Promise<Role> => {
    const res = await httpClient.post('/roles', data);
    return res.data;
};

export const updateRole = async (id: string, data: {
    name?: string;
}): Promise<Role> => {
    const res = await httpClient.patch(`/roles/${id}`, data);
    return res.data;
};

export const deleteRole = async (id: string): Promise<void> => {
    await httpClient.delete(`/roles/${id}`);
};

export interface CreateRoleDto {
    name: string;
}

export interface UpdateRoleDto {
    name?: string;
} 