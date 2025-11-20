import { subscribeToExchange } from '../utils/rabbitmq.js';
import Appointment from '../models/appointment.js'; 
import { Op } from 'sequelize';                       

const handleVehicleEvents = async (message) => {
  try {
    const { eventType, payload } = message;
    console.log(`Received vehicle event [${eventType}]:`, payload);

    // Nếu xe bị XÓA, tự động HỦY các lịch hẹn SẮP TỚI của xe đó
    if (eventType === 'VEHICLE_DELETED') {
      const { vehicleId } = payload;
      if (!vehicleId) return;

      const upcomingAppointments = await Appointment.findAll({
        where: {
          vehicleId: vehicleId,
          status: { [Op.in]: ['pending', 'confirmed'] }
        }
      });

      if (upcomingAppointments.length > 0) {
        await Appointment.update(
          { status: 'cancelled', notes: 'Xe đã bị xóa khỏi hệ thống.' },
          { where: { id: upcomingAppointments.map(app => app.id) } }
        );
        console.log(`[Consumer] Đã tự động hủy ${upcomingAppointments.length} lịch hẹn của xe ${vehicleId}`);
      }
    }

  } catch (error) {
    console.error('Error handling vehicle event:', error.message);
  }
};

// Hàm xử lý khi nhận được tin nhắn từ 'user_events'
const handleUserEvents = async (message) => {
  try {
    const { eventType, payload } = message;
    console.log(`Received user event [${eventType}]:`, payload);

    // Nếu người dùng (khách hàng) bị KHÓA/XÓA
    if (eventType === 'USER_DELETED' || eventType === 'USER_BANNED') {
      const { userId } = payload;
      if (!userId) return;

      const upcomingAppointments = await Appointment.findAll({
        where: {
          userId: userId,
          status: { [Op.in]: ['pending', 'confirmed'] }
        }
      });

      if (upcomingAppointments.length > 0) {
        await Appointment.update(
          { status: 'cancelled', notes: 'Tài khoản khách hàng đã bị xóa/khóa.' },
          { where: { id: upcomingAppointments.map(app => app.id) } }
        );
        console.log(`[Consumer] Đã tự động hủy ${upcomingAppointments.length} lịch hẹn của user ${userId}`);
      }
    }
    
  } catch (error) {
    console.error('Error handling user event:', error.message);
  }
};


// Hàm khởi động tất cả các consumer cho dịch vụ này
export const startBookingConsumers = async () => {
  // Sửa: Đổi tên hàm xử lý cho rõ ràng
  await subscribeToExchange('vehicle_events', handleVehicleEvents);
  await subscribeToExchange('user_events', handleUserEvents);
  
  console.log('[Consumers] Booking Service consumers started...');
};