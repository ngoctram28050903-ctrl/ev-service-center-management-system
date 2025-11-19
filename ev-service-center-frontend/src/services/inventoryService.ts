import { httpClient } from "@/lib/httpClient";

export interface Part {
    id: number;
    name: string;
    partNumber: string;
    description: string;
    category: string;
    price: number;
    stockQuantity: number;
    minStockLevel: number;
    supplier: string;
    createdAt: string;
    updatedAt: string;
}

export interface StockLog {
    id: number;
    partId: number;
    type: 'in' | 'out';
    quantity: number;
    reason: string;
    reference: string;
    createdAt: string;
    updatedAt: string;
    
    // Relations
    part?: Part;
}

export interface PartsUsage {
    id: number;
    partId: number;
    workOrderId: number;
    quantity: number;
    createdAt: string;
    updatedAt: string;
    
    // Relations
    part?: Part;
}

export interface CreatePartRequest {
    name: string;
    partNumber: string;
    description: string;
    category: string;
    price: number;
    stockQuantity: number;
    minStockLevel: number;
    supplier: string;
}

export interface UpdateStockRequest {
    partId: number;
    type: 'in' | 'out';
    quantity: number;
    reason: string;
    reference: string;
}

export const getParts = async (): Promise<Part[]> => {
    const res = await httpClient.get('/api/parts');
    return res.data;
};

export const addPart = async (data: CreatePartRequest): Promise<Part> => {
    const res = await httpClient.post('/api/parts', data);
    return res.data;
};

export const updateStock = async (data: UpdateStockRequest): Promise<StockLog> => {
    const res = await httpClient.post('/api/parts/stock', data);
    return res.data;
};
