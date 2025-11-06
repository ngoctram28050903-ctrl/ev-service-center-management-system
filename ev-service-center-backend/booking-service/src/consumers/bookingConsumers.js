import { subscribeToExchange } from '../utils/rabbitmq.js'; 

// Hàm xử lý khi nhận được tin nhắn từ 'vehicle_events'
const handleVehicleUpdated = async (message) => {
  try {
    const { vehicleId, updatedData } = message.payload;
    console.log(`Received vehicle update for ID ${vehicleId}:`, updatedData);
    
    // Ví dụ: Cập nhật thông tin liên quan trong dịch vụ booking (nếu cần)
    // const appointments = await Appointment.findAll({ where: { vehicleId } });
    // ... logic cập nhật
    
  } catch (error) {
    console.error('Error handling vehicle update:', error.message);
  }
};

// Hàm xử lý khi nhận được tin nhắn từ 'user_events'
const handleUserUpdated = async (message) => {
  try {
    const { userId, updatedData } = message.payload;
    console.log(`Received user update for ID ${userId}:`, updatedData);
    
    // ... logic cập nhật
    
  } catch (error) {
    console.error('Error handling user update:', error.message);
  }
};


// Hàm khởi động tất cả các consumer cho dịch vụ này
export const startBookingConsumers = async () => {
  await subscribeToExchange('vehicle_events', handleVehicleUpdated);
  await subscribeToExchange('user_events', handleUserUpdated);
  // Thêm bất kỳ consumer nào khác mà service này cần lắng nghe
  
  console.log('📥 Booking consumers started');
};