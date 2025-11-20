import WorkOrder from '../models/workOrder.js';
import ChecklistItem from '../models/checklistItem.js';
import { publishToExchange } from '../utils/rabbitmq.js';
import { Op } from 'sequelize';
import redisClient from '../config/redis.js';
import sequelize from '../config/db.js';
import { bookingClient, vehicleClient, userClient } from '../client/index.js';

// thời gian hết hạn (Time-To-Live)
const WORKORDER_DETAIL_TTL = 3600;      // 1 giờ: Cache chi tiết
const WORKORDER_LIST_TTL = 300;         // 5 phút: Cache danh sách (thay đổi thường xuyên)
const WORKORDER_STATS_TTL = 43200;      // 12 giờ: Cache thống kê (nặng, ít thay đổi)
const CHECKLIST_ITEM_TTL = 3600;        // 1 giờ
const CHECKLIST_LIST_TTL = 300;         // 5 phút

const getWorkOrderStatsCacheKey = () => {
  const currentYear = new Date().getFullYear();
  return `workorders:stats:year:${currentYear}`;
};
const getRevenueStatsCacheKey = (year) => {
  return `stats:revenue:year:${year || new Date().getFullYear()}`;
};
const getTaskStatsCacheKey = (year) => {
  return `stats:tasks:year:${year || new Date().getFullYear()}`;
};
const updateWorkOrderTotalPrice = async (workOrderId) => {
  try {
    const workOrder = await WorkOrder.findByPk(workOrderId);
    if (workOrder) {
      const completedItems = await ChecklistItem.findAll({
        where: { workOrderId: workOrderId, completed: true },
      });
      const totalPrice = completedItems.reduce((sum, item) => sum + item.price, 0);
      await workOrder.update({ totalPrice });
      const cacheKey = `workorder:detail:${workOrderId}`;
      await redisClient.del(cacheKey);
      console.log(`[Cache] DELETED ${cacheKey} (from helper)`);
      const revenueStatsKey = getRevenueStatsCacheKey(new Date().getFullYear());
      await redisClient.del(revenueStatsKey);
      console.log(`[Cache] DELETED ${revenueStatsKey} (price updated)`);
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

    const cacheKey = `workorders:all:page:${page}:limit:${limit}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
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

    const responseData = {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: WORKORDER_LIST_TTL
    });
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getWorkOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `workorder:detail:${id}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json({ data: JSON.parse(cachedData) });
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
    const order = await WorkOrder.findByPk(req.params.id, { include: [
      {
        model: ChecklistItem,
        as: 'checklistItems'
      }
    ] });
    if (!order) return res.status(404).json({ message: 'Work order not found' });
      const workOrderData = order.toJSON();
        try {
        // Fetch dữ liệu liên quan
        const appointment = await bookingClient.getAppointmentById(workOrderData.appointmentId);
        const vehicle = appointment ? await vehicleClient.getVehicleById(appointment.vehicleId) : null;
        const user = workOrderData.userId ? await userClient.getUserById(workOrderData.userId) : null;
        const createdBy = workOrderData.createdById ? await userClient.getUserById(workOrderData.createdById) : null;

        // Gắn vào đối tượng trả về
        workOrderData.appointmentDetails = appointment;
        workOrderData.vehicleDetails = vehicle;
        workOrderData.userDetails = user;
        workOrderData.createdByDetails = createdBy;

    } catch (enrichError) {
        console.error("Error enriching work order details:", enrichError.message);
        // Vẫn tiếp tục, chỉ là trả về dữ liệu không được làm giàu
    }
    await redisClient.set(cacheKey, JSON.stringify(workOrderData), {
      EX: WORKORDER_DETAIL_TTL
    });

    res.status(200).json({
      data: workOrderData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy Work Order theo User ID
 */
export const getWorkOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // --- REDIS (Cache Danh sách User) ---
    const cacheKey = `workorders:user:${userId}:page:${page}:limit:${limit}`;
    
    // 1. KIỂM TRA CACHE
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    // 2. CACHE MISS -> LẤY TỪ DB
    console.log(`[Cache] MISS for ${cacheKey}`);
    const { rows, count } = await WorkOrder.findAndCountAll({
      where: { userId },
      include: [{ model: ChecklistItem, as: 'checklistItems' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const responseData = {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    };

    // 3. LƯU VÀO CACHE
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: WORKORDER_LIST_TTL
    });

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createWorkOrder = async (req, res) => {
  const t = await sequelize.transaction(); 
  try {
    const { appointmentId, serviceCenterId, items } = req.body;
    const existingWorkOrder = await WorkOrder.findOne({
      where: { appointmentId: appointmentId }
    });
    if (existingWorkOrder) {
      return res.status(400).json({ message: 'Work order already exists for this appointment' });
    }

    const workOrder = await WorkOrder.create({
      appointmentId,
      serviceCenterId,
      status: 'pending',
      totalPrice: 0,
    }, { transaction: t });

    const itemsWithWorkOrderId = items.map(item => ({
      ...item,
      workOrderId: workOrder.id
    }));

    await ChecklistItem.bulkCreate(itemsWithWorkOrderId, { transaction: t });
    await t.commit(); // Hoàn thành transaction

    // Lấy lại đầy đủ thông tin
    const newWorkOrder = await WorkOrder.findByPk(workOrder.id, {
      include: [{ model: ChecklistItem, as: 'checklistItems' }]
    });
    // Gửi sự kiện cho các service khác
    await publishToExchange('workorder_events', {
      type: 'WORKORDER_CREATED',
      payload: newWorkOrder // Gửi toàn bộ đối tượng work order mới
    });

    const statsCacheKey = getWorkOrderStatsCacheKey();
    await redisClient.del(statsCacheKey);
    console.log(`[Cache] DELETED ${statsCacheKey}`);
    res.status(201).json({ data: newWorkOrder, message: 'Work order created successfully' });
  } catch (err) {
    await t.rollback(); // Rollback nếu có lỗi
    res.status(400).json({ message: err.message });
  }
  await redisClient.del(getRevenueStatsCacheKey());
  await redisClient.del(getTaskStatsCacheKey());
};

/**
 * Cập nhật trạng thái Work Order
 */
export const updateWorkOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const workOrder = await WorkOrder.findByPk(id);
    if (!workOrder) return res.status(404).json({ message: 'WorkOrder not found' });
    
    await workOrder.update({ status });
    // Gửi sự kiện khi có cập nhật (đặc biệt là khi status thay đổi)
    await publishToExchange('workorder_events', {
      type: 'WORKORDER_UPDATED',
      payload: workOrder // Gửi toàn bộ đối tượng đã cập nhật
    });
    // 1. Xóa cache 'Chi tiết'
    const detailCacheKey = `workorder:detail:${id}`;
    await redisClient.del(detailCacheKey);
    console.log(`[Cache] DELETED ${detailCacheKey}`);

    // 2. Xóa cache 'Thống kê' (vì status thay đổi)
    const statsCacheKey = getWorkOrderStatsCacheKey();
    await redisClient.del(statsCacheKey);
    console.log(`[Cache] DELETED ${statsCacheKey}`);

    res.status(200).json({
      data: workOrder,
      message: 'WorkOrder status updated successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
  await redisClient.del(getRevenueStatsCacheKey());
};
export const deleteWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Work order not found' });
    // Xóa cache chi tiết
    const detailCacheKey = `workorder:detail:${req.params.id}`;
    await redisClient.del(detailCacheKey);
    // Xóa cache stats
    await redisClient.del(getWorkOrderStatsCacheKey());
    await redisClient.del(getRevenueStatsCacheKey());
    await redisClient.del(getTaskStatsCacheKey());
    // Xóa cache danh sách (ví dụ trang 1)
    await redisClient.del(`workorders:all:page:1:limit:10`);
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
    await redisClient.del(getTaskStatsCacheKey());
    await redisClient.del(`checklistitems:wo:${req.params.work_order_id}`);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getChecklistItems = async (req, res) => {
  try {
    const cacheKey = `checklistitems:wo:${req.params.work_order_id}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
    const items = await ChecklistItem.findAll({
      where: { workOrderId: req.params.work_order_id },
    });
    await redisClient.set(cacheKey, JSON.stringify(items), {
      EX: CHECKLIST_LIST_TTL
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getWorkOrderByAppointmentId = async (req, res) => {
  try {
    const cacheKey = `workorder:appt:${req.params.work_order_id}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
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
    await redisClient.set(cacheKey, JSON.stringify(workOrder), {
      EX: WORKORDER_DETAIL_TTL // Dùng TTL chi tiết
    });
    res.json(workOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getChecklistItemById = async (req, res) => {
  try {
    const cacheKey = `checklistitem:${req.params.checklist_id}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
    const item = await ChecklistItem.findOne({
      where: { 
        id: req.params.checklist_id,
        workOrderId: req.params.work_order_id 
      },
    });
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });
    await redisClient.set(cacheKey, JSON.stringify(item), {
      EX: CHECKLIST_ITEM_TTL
    });
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
    // --- REDIS (MỚI): Xóa cache của chính item này ---
    const itemCacheKey = `checklistitem:${req.params.checklist_id}`;
    await redisClient.del(itemCacheKey);
    // Xóa cache danh sách của work order cha
    await redisClient.del(`checklistitems:wo:${req.params.work_order_id}`);
    // Xóa cache thống kê task
    await redisClient.del(getTaskStatsCacheKey());
    // Gửi sự kiện khi một mục checklist thay đổi (vì giá có thể đã thay đổi)
    const updatedWorkOrder = await WorkOrder.findByPk(req.params.work_order_id);
    await publishToExchange('workorder_events', {
      type: 'WORKORDER_ITEM_UPDATED',
      payload: updatedWorkOrder // Gửi toàn bộ work order (với giá mới)
    });

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
    const itemCacheKey = `checklistitem:${req.params.checklist_id}`;
    await redisClient.del(itemCacheKey);
    await redisClient.del(`checklistitems:wo:${req.params.work_order_id}`);
    await redisClient.del(getTaskStatsCacheKey());

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
    const cacheKey = `checklistitems:all:page:${page}:limit:${limit}:keyword:${keyword || 'all'}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
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

    const responseData = {
      data: enrichedRows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: CHECKLIST_LIST_TTL // TTL ngắn vì có nhiều client calls
    });
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRevenueStats = async (req, res) => {
  try {
    console.log('Start getRevenueStats');
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const cacheKey = getRevenueStatsCacheKey(year);
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
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

    const responseData = {
      data: revenueStats,
      message: 'Revenue stats retrieved successfully'
    };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: WORKORDER_STATS_TTL // Dùng TTL dài
    });
    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error getting revenue stats:', err);
    res.status(500).json({ message: 'Failed to get revenue stats' });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    console.log('Start getTaskStats');

    const currentYear = new Date().getFullYear();

    const cacheKey = getTaskStatsCacheKey(currentYear);
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    console.log(`[Cache] MISS for ${cacheKey}`);

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

    const responseData = {
      data: taskStats,
      message: 'Task stats retrieved successfully'
    };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: WORKORDER_STATS_TTL // Dùng TTL dài
    });
    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error getting task stats:', err);
    res.status(500).json({ message: 'Failed to get task stats' });
  }
};

// (Hàm này dành cho client/index.js của finance-service)
export const getRevenueStatsInternal = async (req, res) => {
   try {
    const result = await getRevenueStats(req, res); // Hoặc copy logic vào đây
    res.status(200).json(result.data); // Trả về data trực tiếp
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// (Hàm này dành cho client/index.js của finance-service)
export const getTaskStatsInternal = async (req, res) => {
   try {
    const result = await getTaskStats(req, res); // Hoặc copy logic vào đây
    res.status(200).json(result.data); // Trả về data trực tiếp
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
