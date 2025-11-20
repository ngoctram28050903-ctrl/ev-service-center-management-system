import axios from 'axios';

// Lấy địa chỉ TRỰC TIẾP từ .env
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:5002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
const WORKORDER_SERVICE_URL = process.env.WORKORDER_SERVICE_URL || 'http://workorder-service:5007';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:5004';

export const bookingClient = {
    async getDashboardStats() {
        const response = await axios.get(`${BOOKING_SERVICE_URL}/api/booking/internal/stats/booking`);
        return response.data;
    },
    async getAllAppointments(params = {}) {
        const response = await axios.get(`${BOOKING_SERVICE_URL}/api/booking/internal`, { params });
        return response.data;
    },
    async getAppointmentById(appointmentId) {
        const response = await axios.get(`${BOOKING_SERVICE_URL}/api/booking/internal/${appointmentId}`);
        return response.data;
    }
};

export const workorderClient = {
    async getRevenueStats(year) {
        const response = await axios.get(`${WORKORDER_SERVICE_URL}/api/workorder/internal/stats/revenue?year=${year}`);
        return response.data;
    },
    async getTaskStats(year) {
        const response = await axios.get(`${WORKORDER_SERVICE_URL}/api/workorder/internal/stats/tasks?year=${year}`);
        return response.data;
    }
};

export const inventoryClient = {
    async getPartsStats(year) {
        const response = await axios.get(`${INVENTORY_SERVICE_URL}/api/inventory/internal/parts/stats/parts?year=${year}`);
        return response.data;
    },
    async getAllParts(params = {}) {
        const response = await axios.get(`${INVENTORY_SERVICE_URL}/api/inventory/internal/parts`, { params });
        return response.data;
    },
    async getPartById(partId) {
        const response = await axios.get(`${INVENTORY_SERVICE_URL}/api/inventory/internal/parts/${partId}`);
        return response.data;
    }
};

export const authClient = {
    async getUserById(userId) {
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/internal/users/${userId}`);
        return response.data; 
    },
    async getUsersByIds(userIds) {
        const userPromises = userIds.map(id => this.getUserById(id));
        return Promise.all(userPromises);
    },
    async getUserStats() {
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/internal/stats/users`);
        return response.data;
    }
};