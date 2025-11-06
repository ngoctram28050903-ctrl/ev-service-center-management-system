import { subscribeToExchange } from '../utils/rabbitmq.js';
import Invoice from '../models/invoice.js';

/**
 * Hàm xử lý khi nhận được sự kiện từ WorkOrder
 * @param {object} message - Toàn bộ đối tượng tin nhắn từ RabbitMQ
 */
const handleWorkOrderEvent = async (message) => {
  try {
    const { type, payload } = message; 
    console.log(`[CONSUME] Received workorder event: ${type}`);

    // Logic nghiệp vụ: Chỉ tạo hóa đơn khi phiếu sửa chữa "hoàn thành"
    if (type === 'WORKORDER_UPDATED' && payload.status === 'completed') {
      
      const today = new Date();
      const dueDate = new Date(today.setDate(today.getDate() + 14)); // hạng 14 ngày
      const newInvoice = await Invoice.create({
        workOrderId: payload.id,
        customerId: payload.userId, 
        amount: payload.totalPrice, // (Lấy tổng giá tiền)
        status: 'pending' // Trạng thái 'chờ thanh toán'
      });

    console.log(`✅ New invoice created successfully: ${newInvoice.id}`);
    }
    
  } catch (error) {
    console.error(`❌ Error creating invoice from workorder event:`, error.message);
  }
};


export const startFinanceConsumers = async () => {
  try {
  // Bắt đầu lắng nghe queue 'workorder_events'
  await subscribeToExchange('workorder_events', handleWorkOrderEvent);
  console.log('📥 Finance consumers started');
  } catch(error) {
    console.error('❌ Không thể khởi động finance consumers:', error);
    process.exit(1);
  }
};
