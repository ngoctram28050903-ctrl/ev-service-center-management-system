import { subscribeToExchange, publishToExchange } from '../utils/rabbitmq.js';
import Part from '../models/part.js';
import StockLog from '../models/stockLog.js';
import PartsUsage from '../models/partsUsage.js';
import sequelize from '../config/db.js'; 
import { STOCK_CHANGE_TYPES } from '../constants/stockConstants.js';

/**
 * Hàm xử lý khi nhận được sự kiện từ workorder_exchange
 * Logic chính: Tự động trừ kho khi phiếu sửa chữa hoàn thành
 */
const handleWorkOrderEvent = async (message) => {
  const { type, payload } = message;
  if (type !== 'WORKORDER_UPDATED' || payload.status !== 'completed') {
    return; // Bỏ qua nếu không phải sự kiện 'completed'
  }

  console.log(`[CONSUME] Nhận được WorkOrder ${payload.id} đã hoàn thành. Bắt đầu trừ kho...`);
  const { id: workOrderId, partsUsed } = payload;

  if (!partsUsed || partsUsed.length === 0) {
    console.log(`[CONSUME] WorkOrder ${workOrderId} hoàn thành nhưng không sử dụng phụ tùng nào.`);
    return;
  }

  // Sử dụng Transaction để đảm bảo toàn vẹn dữ liệu
  // Nếu một thao tác thất bại, tất cả sẽ bị rollback
  const t = await sequelize.transaction();

  try {
    // Xử lý từng phụ tùng đã sử dụng
    for (const item of partsUsed) {
      const { partId, quantityUsed } = item;

      if (!partId || !quantityUsed || quantityUsed <= 0) {
        console.warn(`[CONSUME] Bỏ qua phụ tùng không hợp lệ trong WO ${workOrderId}:`, item);
        continue;
      }

      // Tìm phụ tùng và khóa lại (lock) để tránh "race condition"
      const part = await Part.findByPk(partId, { transaction: t, lock: t.LOCK.UPDATE });

      if (!part) {
        throw new Error(`Phụ tùng với ID ${partId} không tồn tại (từ WO ${workOrderId}).`);
      }

      // Kiểm tra tồn kho
      if (part.quantity < quantityUsed) {
        throw new Error(`Không đủ tồn kho cho ${part.name} (ID: ${partId}). Cần ${quantityUsed}, có ${part.quantity}.`);
      }

      // Trừ kho
      const oldQuantity = part.quantity;
      part.quantity -= quantityUsed;

      await part.save({ transaction: t });

      // Ghi lại StockLog (Lịch sử xuất kho)
      await StockLog.create({
        partId: part.id,
        changeType: STOCK_CHANGE_TYPES.OUT,
        quantity: quantityUsed,
        reason: `WorkOrder ${workOrderId}` // Lý do rõ ràng
      }, { transaction: t });

      // Ghi lại PartsUsage (Phụ tùng này đã dùng cho WO nào)
      await PartsUsage.create({
        workOrderId: workOrderId,
        partId: part.id,
        quantityUsed: quantityUsed
      }, { transaction: t });

      console.log(`[CONSUME] Đã trừ ${quantityUsed} ${part.name} cho WO ${workOrderId}. Tồn kho còn lại: ${part.quantity}`);

      // (Quan trọng) Kiểm tra và cảnh báo nếu tồn kho thấp
      if (part.quantity <= part.minStock && oldQuantity > part.minStock) {
        const eventPayload = {
          partId: part.id,
          name: part.name,
          partNumber: part.partNumber,
          quantity: part.quantity,
          minStock: part.minStock,
          timestamp: new Date().toISOString()
        };
        // Gửi cảnh báo đến exchange 'inventory_events'
        await publishToExchange('inventory_events', 'PART_LOW_STOCK', eventPayload);
        console.warn(`[EVENT] Cảnh báo TỒN KHO THẤP cho: ${part.name}`);
      }
    }

    // Nếu mọi thứ thành công, commit transaction
    await t.commit();
    console.log(`✅ [CONSUME] Đã xử lý thành công WorkOrder ${workOrderId}.`);

  } catch (error) {
    // Nếu có lỗi, rollback tất cả thay đổi
    await t.rollback();
    console.error(`❌ Lỗi xử lý sự kiện WorkOrder ${workOrderId}:`, error.message);
    // Ghi chú: Cần có cơ chế "Dead Letter Queue" (DLQ) để xử lý lại các message lỗi này
  }
};

/**
 * Hàm khởi động TẤT CẢ consumer cho InventoryService
 */
export const startInventoryConsumers = async () => {
  try {
    // Lắng nghe sự kiện từ workorder-service
    await subscribeToExchange('workorder_events', handleWorkOrderEvent);

    console.log('📥 Inventory consumers started');
  } catch (error) {
    console.error('❌ Không thể khởi động inventory consumers:', error);
    process.exit(1);
  }
};