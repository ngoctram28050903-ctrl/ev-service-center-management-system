import express from 'express';
import {
  getAllWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  addChecklistItem,
  getChecklistItems,
  getAllChecklistItems,
  getWorkOrderByAppointmentId,
  getChecklistItemById,
  updateChecklistItem,
  deleteChecklistItem,
  getRevenueStats,
  getTaskStats,
} from '../controllers/workOrderController.js';

const router = express.Router();

router.get('/', getAllWorkOrders);
router.get('/stats/revenue', getRevenueStats);
router.get('/stats/tasks', getTaskStats);
router.get('/checklist/all', getAllChecklistItems);
router.get('/:id', getWorkOrderById);
router.post('/', createWorkOrder);
router.put('/:id', updateWorkOrder);
router.delete('/:id', deleteWorkOrder);

// Checklist items
router.post('/:work_order_id/checklist', addChecklistItem);
router.get('/:work_order_id/checklist', getChecklistItems);

// Checklist item specific operations
router.get('/:work_order_id/checklist/:checklist_id', getChecklistItemById);
router.put('/:work_order_id/checklist/:checklist_id', updateChecklistItem);
router.delete('/:work_order_id/checklist/:checklist_id', deleteChecklistItem);

// Appointment endpoint
router.get('/appointment/:work_order_id', getWorkOrderByAppointmentId);

export default router;
