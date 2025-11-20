import axios from 'axios';

// Lấy địa chỉ TRỰC TIẾP từ .env
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:5002';
const VEHICLE_SERVICE_URL = process.env.VEHICLE_SERVICE_URL || 'http://vehicle-service:5006';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';

export const bookingClient = {
    async getAppointmentById(appointmentId) {
        try {
            const response = await axios.get(`${BOOKING_SERVICE_URL}/api/booking/internal/${appointmentId}`);
            return response.data.data; // (Giữ nguyên .data.data nếu booking-service trả về { data: ... })
        } catch (error) {
            console.error('Error fetching appointment:', error.message);
            throw new Error('Failed to fetch appointment');
        }
    },
    async getAppointmentsByUserId(userId) {
        try {
            const response = await axios.get(`${BOOKING_SERVICE_URL}/api/booking/internal/user/${userId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching appointments:', error.message);
            throw new Error('Failed to fetch appointments');
        }
    }
};

export const vehicleClient = {
    async getVehicleById(vehicleId) {
        try {
            const response = await axios.get(`${VEHICLE_SERVICE_URL}/api/vehicle/internal/${vehicleId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching vehicle:', error.message);
            throw new Error('Failed to fetch vehicle');
        }
    }
};

export const userClient = {
    async getUserById(userId) {
        try {
            const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/internal/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user:', error.message);
            throw new Error(`Failed to fetch user with ID ${userId}`);
        }
    },
    async getUsersByIds(userIds) {
        const userPromises = userIds.map(id => this.getUserById(id));
        return Promise.all(userPromises);
    }
};