import { subscribeToExchange } from '../utils/rabbitmq.js';

/**
 * Hàm xử lý khi nhận được sự kiện từ workorder_exchange
 */
const handleWorkOrderEvent = async (message) => {
  try {
    const { type, payload } = message;

    // Chỉ hành động khi phiếu sửa chữa hoàn thành
    if (type === 'WORKORDER_UPDATED' && payload.status === 'completed') {
      console.log(`[CONSUME] Nhận được WorkOrder ${payload.id} đã hoàn thành. Đang kiểm tra phụ tùng...`);
    }
  } catch (error) {
    console.error(`❌ Lỗi xử lý sự kiện workorder:`, error.message);
  }
};

/**
 * Hàm khởi động TẤT CẢ consumer cho InventoryService
 * (CHỈ CÓ MỘT HÀM NÀY)
 */
export const startInventoryConsumers = async () => {
  try {
    // Lắng nghe sự kiện từ workorder-service
    await subscribeToExchange('workorder_events', handleWorkOrderEvent);

    console.log('📥 Inventory consumers started');
  } catch (error) {
    console.error('❌ Không thể khởi động inventory consumers:', error);
    // Xử lý lỗi khởi động nếu cần, ví dụ: thoát tiến trình
    process.exit(1); 
  }
};