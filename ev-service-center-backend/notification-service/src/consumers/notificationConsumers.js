import { subscribeToExchange } from '../utils/rabbitmq.js';
import Notification from '../models/notification.js';
import emailService from '../services/emailService.js';

// Xử lý sự kiện LỊCH HẸN MỚI
const handleBookingEvent = async (message) => {
  try {
    const { type, payload } = message;
    console.log(`[CONSUME] Received booking event: ${type}`);
    
    if (type === 'APPOINTMENT_CREATED') {
      const messageContent = `Lịch hẹn của bạn (ID: ${payload.appointmentId}) cho xe ${payload.vehicle} vào lúc ${payload.date} đã được xác nhận.`;
      // Lưu thông báo vào CSDL cho khách hàng
      if (payload.customerId) {
          await Notification.create({
            userId: payload.customerId,
            message: messageContent,
            type: 'booking_confirmation',
            status: 'unread'
          });
        }
        if (payload.customerEmail) {
        console.log(`>>> Gửi email xác nhận lịch hẹn tới ${payload.customerEmail}`);
        await emailService.sendEmail(
          payload.customerEmail, 
          'Xác nhận lịch hẹn', 
          messageContent
        );
      }
    }
  } catch (error) {
    console.error(`❌ Error handling booking event:`, error.message);
  }
};

// Xử lý sự kiện PHIẾU SỬA CHỮA
const handleWorkOrderEvent = async (message) => {
  try {
    const { type, payload } = message;
    console.log(`[CONSUME] Received workorder event: ${type}, Status: ${payload?.status}`);
    
    if (type === 'WORKORDER_UPDATED' && payload.status === 'completed') { 
      const messageContent = `Dịch vụ cho xe ${payload.vehicle} (Phiếu sửa chữa ID: ${payload.workOrderId}) đã hoàn thành. Tổng chi phí: ${payload.totalCost}.`;
      if (payload.customerId) {
        await Notification.create({
          userId: payload.customerId,
          message: messageContent,
          type: 'service_completed',
          status: 'unread'
        });
      }
      // gửi mail
      if (payload.customerEmail) {
        console.log(`>>> Gửi email báo dịch vụ hoàn thành tới ${payload.customerEmail}`);
        await emailService.sendEmail(
          payload.customerEmail, 
          'Dịch vụ của bạn đã hoàn thành', 
          messageContent
        );
      }
    }
  } catch (error) {
    console.error(`❌ Error handling workorder event:`, error.message);
  }
};

const handleInventoryEvent = async (message) => {
  try {
    const { type, payload } = message;
    console.log(`[CONSUME] Received inventory event: ${type}`);
    
    if (type === 'PART_LOW_STOCK') {
      // GỌI HÀM GỬI MAIL/THÔNG BÁO CHO QUẢN LÝ KHO
      const messageContent = `Cảnh báo: Phụ tùng "${payload.name}" (ID: ${payload.partId}) sắp hết hàng. Tồn kho hiện tại: ${payload.quantity}.`;
      if (payload.managerId) {
        await Notification.create({
          userId: payload.managerId, // ID của người nhận (quản lý kho)
          message: messageContent,
          type: 'inventory_alert',
          status: 'unread'
        });
    }
    if (payload.managerEmail) {
        console.log(`>>> Đang gửi email cảnh báo sắp hết hàng tới ${payload.managerEmail}`);
        await emailService.sendEmail(
          payload.managerEmail, 
          'Cảnh báo tồn kho thấp', 
          messageContent
        );
      }
    }
  } catch (error) {
    console.error(`❌ Error handling inventory event:`, error.message);
  }
};

// 4. Hàm khởi động TẤT CẢ consumer
export const startNotificationConsumers = async () => {
  try {
  await subscribeToExchange('booking_events', handleBookingEvent);
  await subscribeToExchange('workorder_events', handleWorkOrderEvent);
  await subscribeToExchange('inventory_events', handleInventoryEvent);
} catch (error) {
    console.error('❌ Không thể khởi động notification consumers:', error);
    process.exit(1);
  }
};
