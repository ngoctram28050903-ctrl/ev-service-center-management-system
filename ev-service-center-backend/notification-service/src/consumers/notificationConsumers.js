import { subscribeToExchange } from '../utils/rabbitmq.js';

// Xử lý sự kiện LỊCH HẸN MỚI
const handleBookingEvent = async (message) => {
  try {
    const { type, payload } = message;
    console.log(`[CONSUME] Received booking event: ${type}`);
    
    if (type === 'APPOINTMENT_CREATED') {
      console.log('>>> Gửi email xác nhận lịch hẹn...');
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
      console.log('>>> Gửi email báo dịch vụ hoàn thành...');
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
      console.log(`>>> Gửi email cảnh báo sắp hết hàng: ${payload.name}`);
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
