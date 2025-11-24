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

export const getAllWorkOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await WorkOrder.findAndCountAll({
      include: [
        {
          model: ChecklistItem,
          as: 'checklistItems'
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getWorkOrderById = async (req, res) => {
  try {
    const order = await WorkOrder.findByPk(req.params.id, { include: [
      {
        model: ChecklistItem,
        as: 'checklistItems'
      }
    ] });
    if (!order) return res.status(404).json({ message: 'Work order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createWorkOrder = async (req, res) => {
  try {
    const newOrder = await WorkOrder.create({
      ...req.body,
      totalPrice: 0
    });
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Work order not found' });
    await order.update(req.body);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Work order not found' });
    await order.destroy();
    res.json({ message: 'Work order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addChecklistItem = async (req, res) => {
  try {
    const item = await ChecklistItem.create({
      workOrderId: req.params.work_order_id,
      ...req.body,
    });
    
    if (item.completed === true) {
      await updateWorkOrderTotalPrice(req.params.work_order_id);
    }
    
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getChecklistItems = async (req, res) => {
  try {
    const items = await ChecklistItem.findAll({
      where: { workOrderId: req.params.work_order_id },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getWorkOrderByAppointmentId = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findOne({
      where: { appointmentId: req.params.work_order_id },
      include: [
        {
          model: ChecklistItem,
          as: 'checklistItems'
        }
      ],
    });
    if (!workOrder) return res.status(404).json({ message: 'Work order not found for this appointment' });
    res.json(workOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getChecklistItemById = async (req, res) => {
  try {
    const item = await ChecklistItem.findOne({
      where: { 
        id: req.params.checklist_id,
        workOrderId: req.params.work_order_id 
      },
    });
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateChecklistItem = async (req, res) => {
  try {
    const item = await ChecklistItem.findOne({
      where: { 
        id: req.params.checklist_id,
        workOrderId: req.params.work_order_id 
      },
    });
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });
    
    await item.update(req.body);
    
    if (req.body.completed !== undefined) {
      await updateWorkOrderTotalPrice(req.params.work_order_id);
    }
    
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteChecklistItem = async (req, res) => {
  try {
    const item = await ChecklistItem.findOne({
      where: { 
        id: req.params.checklist_id,
        workOrderId: req.params.work_order_id 
      },
    });
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });
    
    await item.destroy();
    
    await updateWorkOrderTotalPrice(req.params.work_order_id);
    
    res.json({ message: 'Checklist item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllChecklistItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || '';
    const offset = (page - 1) * limit;

    let whereCondition = {};
    if (keyword.trim()) {
      whereCondition = {
        [Op.or]: [
          { task: { [Op.like]: `%${keyword}%` } },
          { price: { [Op.like]: `%${keyword}%` } },
        ]
      };
    }

    const { rows, count } = await ChecklistItem.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: WorkOrder,
          as: 'workOrder',
          attributes: ['id', 'appointmentId', 'totalPrice']
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Enrich checklist items with appointment, vehicle, and assigned user information
    const enrichedRows = await Promise.all(
      rows.map(async (item) => {
        const itemData = item.toJSON();
        
        try {
          if (itemData.workOrder?.appointmentId) {
            // Get appointment details
            const appointment = await bookingClient.getAppointmentById(itemData.workOrder.appointmentId);
            
            if (appointment?.vehicleId) {
              // Get vehicle details
              const vehicle = await vehicleClient.getVehicleById(appointment.vehicleId);
              itemData.vehicle = vehicle;
            }
            
            itemData.appointment = appointment;
          }

          // Get assigned user information if assignedToUserId exists
          if (itemData.assignedToUserId) {
            try {
              const assignedUser = await userClient.getUserById(itemData.assignedToUserId);
              itemData.assignedUser = assignedUser;
            } catch (error) {
              console.error('Error fetching assigned user details:', error.message);
              // Continue without assigned user data if there's an error
            }
          }
        } catch (error) {
          console.error('Error fetching appointment/vehicle details:', error.message);
          // Continue without appointment/vehicle data if there's an error
        }
        
        return itemData;
      })
    );

    res.status(200).json({
      data: enrichedRows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRevenueStats = async (req, res) => {
  try {
    console.log('Start getRevenueStats');
    
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    const totalStats = await WorkOrder.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalWorkOrders'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
      ],
      where: {
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      raw: true
    });

    const monthlyStats = await WorkOrder.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'revenue']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(year, 0, 1), // Từ đầu năm
          [Op.lt]: new Date(year + 1, 0, 1) // Đến đầu năm sau
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
      order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    console.log('monthlyRevenueStats = ', monthlyStats);

    const monthlyRevenue = new Array(12).fill(0);

    monthlyStats.forEach(stat => {
      const monthIndex = parseInt(stat.month) - 1;
      monthlyRevenue[monthIndex] = parseFloat(stat.revenue) || 0;
    });

    const result = totalStats[0] || {};
    const totalWorkOrders = parseInt(result.totalWorkOrders) || 0;
    const totalRevenue = parseFloat(result.totalRevenue) || 0;

    const revenueStats = {
      totalWorkOrders,
      totalRevenue,
      monthlyRevenue,
      year
    };

    console.log('Revenue stats result:', revenueStats);

    res.status(200).json({
      data: revenueStats,
      message: 'Revenue stats retrieved successfully'
    });
  } catch (err) {
    console.error('Error getting revenue stats:', err);
    res.status(500).json({ message: 'Failed to get revenue stats' });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    console.log('Start getTaskStats');

    const currentYear = new Date().getFullYear();
    
    // Thống kê tổng số task
    const totalStats = await ChecklistItem.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTasks']
      ],
      raw: true
    });

    // Thống kê task theo tháng (tổng số)
    const monthlyTaskStats = await ChecklistItem.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        }
      },
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
      order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Thống kê task hoàn thành theo tháng
    const monthlyCompletedStats = await ChecklistItem.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        },
        completed: true
      },
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
      order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Thống kê task chưa hoàn thành theo tháng
    const monthlyPendingStats = await ChecklistItem.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        },
        completed: false
      },
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
      order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Khởi tạo mảng 12 tháng với giá trị 0
    const monthlyTasks = new Array(12).fill(0);
    const monthlyCompleted = new Array(12).fill(0);
    const monthlyPending = new Array(12).fill(0);

    // Điền dữ liệu tổng số task theo tháng
    monthlyTaskStats.forEach(stat => {
      const monthIndex = parseInt(stat.month) - 1;
      monthlyTasks[monthIndex] = parseInt(stat.count);
    });

    // Điền dữ liệu task hoàn thành theo tháng
    monthlyCompletedStats.forEach(stat => {
      const monthIndex = parseInt(stat.month) - 1;
      monthlyCompleted[monthIndex] = parseInt(stat.count);
    });

    // Điền dữ liệu task chưa hoàn thành theo tháng
    monthlyPendingStats.forEach(stat => {
      const monthIndex = parseInt(stat.month) - 1;
      monthlyPending[monthIndex] = parseInt(stat.count);
    });

    const result = totalStats[0] || {};
    const totalTasks = parseInt(result.totalTasks) || 0;

    const taskStats = {
      totalTasks,
      monthlyTasks,
      monthlyCompleted,
      monthlyPending,
      year: currentYear
    };

    console.log('Task stats result:', taskStats);

    res.status(200).json({
      data: taskStats,
      message: 'Task stats retrieved successfully'
    });
  } catch (err) {
    console.error('Error getting task stats:', err);
    res.status(500).json({ message: 'Failed to get task stats' });
  }
};
