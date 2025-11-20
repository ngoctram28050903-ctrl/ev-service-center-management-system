import Vehicle from '../models/vehicle.js';
import Reminder from '../models/reminder.js';
import { publishToExchange } from '../utils/rabbitmq.js';
import { Op } from 'sequelize';
import redisClient from '../config/redis.js';


const VEHICLE_DETAIL_TTL = 3600; //1h
const VEHICLE_LIST_TTL = 600; //10p
// Lấy tất cả xe
export const getAllVehicles = async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.userId;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (userId) {
      whereClause.userId = parseInt(userId);
    }
    if (keyword) {
      whereClause[Op.or] = [
        { licensePlate: { [Op.like]: `%${keyword}%` } },
        { brand: { [Op.like]: `%${keyword}%` } },
        { model: { [Op.like]: `%${keyword}%` } },
        { year: { [Op.like]: `%${keyword}%` } },
      ];
    }
    // redis tạo key động
    const keywordCache = keyword || 'all';
    const userIdCache = userId || 'all';
    const cacheKey = `vehicles:all:user:${userIdCache}:keyword:${keywordCache}:page:${page}:limit:${limit}`;

    const cachedData = await redisClient.get(cacheKey); //kiểm tra cache
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log(`[Cache] MISS for ${cacheKey}`); // lấy từ database
    const { rows, count } = await Vehicle.findAndCountAll({
      where: whereClause,
      include: Reminder,
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
    // lưu vào cache
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: VEHICLE_LIST_TTL,
    });

    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Lấy chi tiết một bằng Id
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `vehicle:${id}`;
    //kiểm tra
    const cachedVehicle = await redisClient.get(cacheKey);
    if (cachedVehicle) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json({
        data: JSON.parse(cachedVehicle)
      });
    }
    console.log(`[Cache] MISS for ${cacheKey}`);
    const vehicle = await Vehicle.findByPk(req.params.id, { include: Reminder });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const isOwner = vehicle.userId === req.user.id;
    const isAdmin = req.user.role.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to view this vehicle' });
    }

    //lưu vào cache
    await redisClient.set(cacheKey, JSON.stringify(vehicle), {
      EX: VEHICLE_DETAIL_TTL,
    });

    res.status(200).json({
      data: vehicle
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Lấy xe theo User ID
export const getVehiclesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const isSelf = parseInt(userId) === req.user.id;
    const isAdmin = req.user.role.includes('admin');
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own vehicles' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const cacheKey = `vehicles:user:${userId}:page:${page}:limit:${limit}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log(`[Cache] MISS for ${cacheKey}`);
    const { rows, count } = await Vehicle.findAndCountAll({
      where: { userId: parseInt(userId) },
      include: Reminder,
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
      EX: VEHICLE_LIST_TTL,
    });
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//tạo xe
export const createVehicle = async (req, res) => {
  try {
    const ownerId = req.user.id; // LẤY userId TỪ TOKEN
    // Tạo xe và gán userId một cách an toàn
    const newVehicle = await Vehicle.create({
      ...req.body,
      userId: ownerId, // Ghi đè userId từ token, bỏ qua req.body.userId (nếu có)
    });
    //xóa cache danh sách
    const cacheKeyUserList = `vehicles:user:${ownerId}:page:1:limit:10`;
    await redisClient.del(cacheKeyUserList);
    //xóa cache getAllVehicles
    const cacheKeyAllList = `vehicles:all:user:all:keyword:all:page:1:limit:10`;
    await redisClient.del(cacheKeyAllList);

    res.status(201).json({
      newVehicle,
      data: newVehicle,
      message: 'Vehicle created successfully'
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    // kiểm tra quyền sở hữu
    const isOwner = vehicle.userId === req.user.id;
    const isAdmin = req.user.role.includes('admin'); // Giả sử role lưu trong req.user.role
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not own this vehicle' });
    }

    await vehicle.update(req.body);
    //xóa cache của opject 
    const cacheKey = `vehicle:${id}`;
    await redisClient.del(cacheKey);
    console.log(`[Cache] DELETED ${cacheKey}`);
    await publishToExchange('vehicle_events', {
      type: 'VEHICLE_UPDATED',
      payload: vehicle // Gửi toàn bộ thông tin xe đã cập nhật
    });
    res.status(200).json({
      data: vehicle,
      message: 'Vehicle updated successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const isOwner = vehicle.userId === req.user.id;
    const isAdmin = req.user.role.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not own this vehicle' });
    }

    const cacheKey = `vehicle:${id}`;
    await vehicle.destroy();
    // Xóa cache chi tiết SAU KHI đã xóa DB thành công
    await redisClient.del(cacheKey);
    console.log(`[Cache] DELETED ${cacheKey}`);

    res.status(200).json({ 
      message: 'Vehicle deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addReminder = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    // Tìm xe cha
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Kiểm tra quyền sở hữu xe cha
    const isOwner = vehicle.userId === req.user.id;
    const isAdmin = req.user.role.includes('admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not own this vehicle' });
    }
    const reminder = await Reminder.create({
      vehicleId: req.params.vehicle_id,
      ...req.body,
    });

    const vehicleCacheKey = `vehicle:${vehicle_id}`;
    await redisClient.del(vehicleCacheKey);
    console.log(`[Cache] DELETED ${vehicleCacheKey} (due to new reminder)`);
    
    res.status(201).json({
      data: reminder,
      message: 'Reminder created successfully'
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getReminders = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    // Tìm xe cha
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Kiểm tra quyền sở hữu xe cha
    const isOwner = vehicle.userId === req.user.id;
    const isAdmin = req.user.role.includes('admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not own this vehicle' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { rows, count } = await Reminder.findAndCountAll({
      where: { vehicleId: req.params.vehicle_id },
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

export const getVehicleByIdInternal = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{ model: Reminder, as: 'reminders' }]
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found (internal)' });
    }

    // QUAN TRỌNG: Trả về { data: vehicle } 
    // vì các client/index.js của bạn đang mong đợi .data.data
    res.status(200).json({ data: vehicle }); 

  } catch (err) {
    console.error("!!! LỖI TRONG HÀM getVehicleByIdInternal:", err);
    res.status(500).json({ message: err.message });
  }
};
