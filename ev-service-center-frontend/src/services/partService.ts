import { httpClient } from "@/lib/httpClient";
import { 
  Part, 
  CreatePartDto, 
  UpdatePartDto, 
  UpdateStockDto, 
  PartsResponse, 
  StockHistoryResponse 
} from "@/types/common";

const API_BASE_URL = "/api/inventory/parts";

// Get all parts with pagination and filtering
export const getParts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  minStock?: number;
}): Promise<PartsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.minStock !== undefined) queryParams.append('minStock', params.minStock.toString());

  const url = queryParams.toString() ? `${API_BASE_URL}?${queryParams}` : API_BASE_URL;
  
  const response = await httpClient.get(url);
  return response.data;
};

// Get part details by ID
export const getPartById = async (id: number): Promise<{ data: Part }> => {
  const response = await httpClient.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

// Create new part
export const createPart = async (partData: CreatePartDto): Promise<{ data: Part; message: string }> => {
  const response = await httpClient.post(API_BASE_URL, partData);
  return response.data;
};

// Update part information
export const updatePart = async (id: number, partData: UpdatePartDto): Promise<{ data: Part; message: string }> => {
  const response = await httpClient.put(`${API_BASE_URL}/${id}`, partData);
  return response.data;
};

// Delete part
export const deletePart = async (id: number): Promise<{ message: string }> => {
  const response = await httpClient.delete(`${API_BASE_URL}/${id}`);
  return response.data;
};

// Update stock (in/out)
export const updateStock = async (id: number, stockData: UpdateStockDto): Promise<{ data: Part; message: string }> => {
  const response = await httpClient.put(`${API_BASE_URL}/${id}/stock`, stockData);
  return response.data;
};

// Get stock history for a part
export const getStockHistory = async (id: number, params?: {
  page?: number;
  limit?: number;
}): Promise<StockHistoryResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = queryParams.toString() 
    ? `${API_BASE_URL}/${id}/stock-history?${queryParams}` 
    : `${API_BASE_URL}/${id}/stock-history`;
  
  const response = await httpClient.get(url);
  return response.data;
};

// Export all parts functions
export type {
  Part,
  CreatePartDto,
  UpdatePartDto,
  UpdateStockDto,
  PartsResponse,
  StockHistoryResponse
};
