import axios from 'axios';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL;

export const userClient = {
    async getUserById(userId) {
        try {
            const response = await axios.get(`${API_GATEWAY_URL}/api/auth/users/${userId}`);
            return response.data.data || response.data;
        } catch (error) {
            console.error('Error fetching user:', error.message);
            throw new Error(`Failed to fetch user with ID ${userId}`);
        }
    },

    async getUsersByIds(userIds) {
        try {
            const userPromises = userIds.map(id => this.getUserById(id));
            const users = await Promise.all(userPromises);
            return users;
        } catch (error) {
            console.error('Error fetching users:', error.message);
            throw new Error('Failed to fetch users');
        }
    }
};

export const vehicleClient = {
    async getVehicleById(vehicleId) {
        try {
            const response = await axios.get(`${API_GATEWAY_URL}/api/vehicle/${vehicleId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching vehicle:', error.message);
            throw new Error(`Failed to fetch vehicle with ID ${vehicleId}`);
        }
    },

    async getVehiclesByIds(vehicleIds) {
        try {
            const vehiclePromises = vehicleIds.map(id => this.getVehicleById(id));
            const vehicles = await Promise.all(vehiclePromises);
            return vehicles;
        } catch (error) {
            console.error('Error fetching vehicles:', error.message);
            throw new Error('Failed to fetch vehicles');
        }
    }
};

export const notificationClient = {
    async createNotification(notificationData) {
        try {
            const response = await axios.post(`${API_GATEWAY_URL}/api/notification`, notificationData);
            return response.data;
        } catch (error) {
            console.error('Error creating notification:', error.message);
            throw new Error('Failed to create notification');
        }
    },

    async createMultipleNotifications(notifications) {
        try {
            const notificationPromises = notifications.map(notification => 
                this.createNotification(notification)
            );
            const results = await Promise.all(notificationPromises);
            return results;
        } catch (error) {
            console.error('Error creating multiple notifications:', error.message);
            throw new Error('Failed to create multiple notifications');
        }
    }
};

