import WorkOrder from '../models/workOrder.js';
import ChecklistItem from '../models/checklistItem.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { bookingClient, vehicleClient, userClient } from '../client/index.js';

const updateWorkOrderTotalPrice = async (workOrderId) => {
  try {
    const workOrder = await WorkOrder.findByPk(workOrderId);
    if (workOrder) {
      const completedItems = await ChecklistItem.findAll({
        where: { 
          workOrderId: workOrderId,
          completed: true 
        },
      });
      
      const totalPrice = completedItems.reduce((sum, item) => sum + item.price, 0);
      await workOrder.update({ totalPrice });
    }
  } catch (error) {
    console.error('Error updating work order total price:', error);
  }
};
