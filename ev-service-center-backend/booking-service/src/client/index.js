import axios from 'axios';

// Lấy địa chỉ TRỰC TIẾP từ .env
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
const VEHICLE_SERVICE_URL = process.env.VEHICLE_SERVICE_URL || 'http://vehicle-service:5006';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5005';

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

export const vehicleClient = {
    async getVehicleById(vehicleId) {
        try {
            const response = await axios.get(`${VEHICLE_SERVICE_URL}/api/vehicle/internal/${vehicleId}`);
            return response.data.data; // (Giữ nguyên .data.data nếu vehicle-service trả về { data: ... })
        } catch (error) {
            console.error('Error fetching vehicle:', error.message);
            throw new Error(`Failed to fetch vehicle with ID ${vehicleId}`);
        }
    },
    async getVehiclesByIds(vehicleIds) {
        const vehiclePromises = vehicleIds.map(id => this.getVehicleById(id));
        return Promise.all(vehiclePromises);
    }
};

export const notificationClient = {
    async createNotification(notificationData) {
        try {
            const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notification/internal`, notificationData);
            return response.data;
        } catch (error) {
            console.error('Error creating notification:', error.message);
            throw new Error('Failed to create notification');
        }
    },
    async createMultipleNotifications(notifications) {
        const notificationPromises = notifications.map(notification => 
            this.createNotification(notification)
        );
        return Promise.all(notificationPromises);
    }
};