export interface Header {
    key: string;
    title: string;
}

export interface RowData {
    id: number;
    [key: string]: string | number | boolean | null | undefined | Array<unknown> | Record<string, unknown> | object;
}

export interface BasicTableProps {
    headers: Header[];
    items: RowData[];
}

export interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
        status?: number;
    };
    message?: string;
}

export interface User extends RowData {
    id: number;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    userRoles?: Array<{
        role: {
            name: string;
        };
    }>;
}

export interface IUserRole {
    role: {
        name: string;
    };
}

// Part types
export interface StockLog {
    id: number;
    changeType: 'IN' | 'OUT';
    quantity: number;
    reason?: string;
    partId: number;
    createdAt: string;
    updatedAt: string;
}

export interface PartsUsage {
    id: number;
    partId: number;
    workOrderId: number;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}

export interface Part extends RowData {
    id: number;
    name: string;
    partNumber: string;
    quantity: number;
    minStock: number;
    createdAt: string;
    updatedAt: string;
    StockLogs?: StockLog[];
    PartsUsages?: PartsUsage[];
}

export interface CreatePartDto {
    name: string;
    partNumber: string;
    quantity?: number;
    minStock?: number;
}

export interface UpdatePartDto {
    name?: string;
    partNumber?: string;
    minStock?: number;
}

export interface UpdateStockDto {
    changeType: 'IN' | 'OUT';
    quantity: number;
    reason?: string;
}

export interface StockHistoryResponse {
    data: {
        part: {
            id: number;
            name: string;
            partNumber: string;
        };
        stockLogs: StockLog[];
    };
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PartsResponse {
    data: Part[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface IStockLog { 
    changeType: string;
    createdAt: string;
    quantity: number;
    reason?: string;
}

export type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";