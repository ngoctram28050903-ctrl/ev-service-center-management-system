import WorkOrder from '../models/workorder.js';
import ChecklistItem from '../models/checklistItem.js';

// Lấy tất cả work orders
export const getAllWorkOrders = async (req, res) => {
  try {
    const workOrders = await WorkOrder.findAll({ include: ChecklistItem });
    res.json(workOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};