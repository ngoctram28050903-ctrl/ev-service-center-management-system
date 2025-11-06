import { subscribeToExchange } from '../utils/rabbitmq.js';
import WorkOrder from '../models/workorder.js';

/**
 * Hàm xử lý khi nhận được sự kiện tạo lịch hẹn mới
 * @param {object} message - Toàn bộ đối tượng tin nhắn từ RabbitMQ
 */
const handleBookingCreated = async (message) => {
  console.log(`[CONSUME] Received a message on booking_events queue:`, message);
  try {
    // 'message' chính là eventMessage mà bookingController đã gử
    const { type, payload } = message; 

    if (type === 'APPOINTMENT_CREATED') {
      console.log(`[CONSUME] Received new booking: ${payload.id}`);

      // Logic nghiệp vụ: Tự động tạo một WorkOrder mới
      // Dữ liệu (payload) là đầy đủ thông tin của lịch hẹn
      const newWorkOrder = await WorkOrder.create({
        appointmentId: payload.id,
        userId: payload.userId,
        vehicleId: payload.vehicleId,
        serviceCenterId: payload.serviceCenterId,
        status: 'pending', // Trạng thái mặc định khi mới tạo
        title: payload.notes || `Work order for booking #${payload.id}`,
        createdById: payload.createdById
      });

      console.log(`✅ New work order created successfully: ${newWorkOrder.id}`);
    } else {
      console.warn(`[CONSUME] Received message with unknown type: ${type}`);
    }
  } catch (error) {
    console.error(`❌ Error creating work order from booking event:`, error.message);
  }
};


/**
 * Hàm khởi động tất cả các consumer cho WorkOrderService
 */
export const startWorkOrderConsumers = async () => {
  // Bắt đầu lắng nghe queue 'booking_events'
  await subscribeToExchange('booking_events', handleBookingCreated);

  console.log('📥 WorkOrder consumers started');
};
