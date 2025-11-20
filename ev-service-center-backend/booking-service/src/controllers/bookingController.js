import Appointment from '../models/appointment.js';
import ServiceCenter from '../models/serviceCenter.js';
import { userClient, vehicleClient, notificationClient } from '../client/index.js';
import { publishToExchange } from '../utils/rabbitmq.js';
import redisClient from '../config/redis.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

//thời gian hết hạn (Time-To-Live)
const BOOKING_DETAIL_TTL = 3600;      // 1 giờ: Cache chi tiết
const BOOKING_LIST_TTL = 300;         // 5 phút: Cache danh sách (thay đổi thường xuyên)
const BOOKING_STATS_TTL = 43200;      // 12 giờ: Cache thống kê (nặng, ít thay đổi)
const AVAILABILITY_TTL = 180;         // 3 phút: Cache lịch rảnh (RẤT QUAN TRỌNG)

const getBookingStatsCacheKey = () => {
  const currentYear = new Date().getFullYear();
  return `bookings:stats:year:${currentYear}`;
};

const statusMapping = {
  'pending': 'Chờ xác nhận',
  'confirmed': 'Đang bảo dưỡng',
  'completed': 'Hoàn thành',
  'cancelled': 'Đã hủy'
};

const notificationTypeMapping = {
  'booking_new': 'Lịch hẹn mới',
  'booking_status_update': 'Cập nhật trạng thái',
  'booking_cancelled': 'Hủy lịch hẹn',
  'workorder_created': 'Tạo phiếu dịch vụ',
  'workorder_completed': 'Hoàn thành dịch vụ'
};

const createDetailedAppointmentMessage = async (appointment, action, additionalInfo = '') => {
  try {
    let message = '';

    let vehicleInfo = '';
    if (appointment.vehicleId) {
      try {
        const vehicle = await vehicleClient.getVehicleById(appointment.vehicleId);
        vehicleInfo = vehicle ? ` cho xe ${vehicle.licensePlate}` : '';
      } catch (error) {
        console.error('Error fetching vehicle info:', error.message);
      }
    }

    let customerInfo = '';
    if (appointment.userId) {
      try {
        const user = await userClient.getUserById(appointment.userId);
        customerInfo = user ? ` từ khách hàng ${user.username}` : '';
      } catch (error) {
        console.error('Error fetching user info:', error.message);
      }
    }

    const appointmentDate = new Date(appointment.date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    switch (action) {
      case 'status_update':
        const { oldStatus, newStatus } = additionalInfo;
        const oldStatusText = statusMapping[oldStatus] || oldStatus;
        const newStatusText = statusMapping[newStatus] || newStatus;
        message = `Lịch hẹn${vehicleInfo} vào ${appointmentDate} đã được cập nhật trạng thái từ "${oldStatusText}" sang "${newStatusText}"`;
        break;
      case 'cancelled':
        message = `Lịch hẹn${vehicleInfo} vào ${appointmentDate} đã bị hủy`;
        break;
      case 'completed':
        message = `Lịch hẹn${vehicleInfo} vào ${appointmentDate} đã hoàn thành`;
        break;
      default:
        message = `Lịch hẹn${vehicleInfo} vào ${appointmentDate} ${action}`;
    }

    return message;
  } catch (error) {
    console.error('Error creating detailed message:', error.message);
    return `Lịch hẹn ${action}`;
  }
};

const notifyStaffNewAppointment = async (appointment, user, vehicle) => {
  try {
    const serviceCenter = await ServiceCenter.findByPk(appointment.serviceCenterId);

    const appointmentDate = new Date(appointment.date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const notificationData = {
      userId: serviceCenter?.managerId || 1,
      message: `Có lịch hẹn mới từ khách hàng ${user?.username || 'Không xác định'} cho xe ${vehicle?.licensePlate || 'Không xác định'} vào ${appointmentDate}`,
      type: 'booking_new',
      status: 'unread'
    };

    await notificationClient.createNotification(notificationData);
    console.log('Notification sent to staff for new appointment');
  } catch (error) {
    console.error('Error sending notification to staff:', error.message);
  }
};

const notifyCustomerStatusUpdate = async (appointment, user, oldStatus, newStatus) => {
  try {
    const message = await createDetailedAppointmentMessage(appointment, 'status_update', { oldStatus, newStatus });

    const notificationData = {
      userId: appointment.userId,
      message,
      type: 'booking_status_update',
      status: 'unread'
    };

    await notificationClient.createNotification(notificationData);
    console.log('Notification sent to customer for status update');
  } catch (error) {
    console.error('Error sending notification to customer:', error.message);
  }
};

const getAppointmentDetails = async (appointment) => {
  const appointmentData = appointment.toJSON();

  try {
    const user = await userClient.getUserById(appointmentData.userId);

    let vehicle = null;
    if (appointmentData.vehicleId) {
      vehicle = await vehicleClient.getVehicleById(appointmentData.vehicleId);
    }

    return {
      ...appointmentData,
      user,
      vehicle
    };
  } catch (error) {
    console.error('Error fetching appointment details:', error.message);
    return {
      ...appointmentData,
      user: null,
      vehicle: null,
      error: 'Failed to fetch related data'
    };
  }
};

const getAppointmentsDetails = async (appointments) => {
  const appointmentsData = appointments.map(appointment => appointment.toJSON());

  try {
    const userIds = [...new Set(appointmentsData.map(apt => apt.userId))];
    const vehicleIds = [...new Set(appointmentsData.map(apt => apt.vehicleId).filter(id => id))];

    const [users, vehicles] = await Promise.all([
      userClient.getUsersByIds(userIds),
      vehicleIds.length > 0 ? vehicleClient.getVehiclesByIds(vehicleIds) : Promise.resolve([])
    ]);

    const userMap = new Map(users.map(user => [user.id, user]));
    const vehicleMap = new Map(vehicles.map(vehicle => [vehicle.id, vehicle]));

    return appointmentsData.map(appointment => ({
      ...appointment,
      user: userMap.get(appointment.userId) || null,
      vehicle: appointment.vehicleId ? (vehicleMap.get(appointment.vehicleId) || null) : null
    }));
  } catch (error) {
    console.error('Error fetching appointments details:', error.message);
    return appointmentsData.map(appointment => ({
      ...appointment,
      user: null,
      vehicle: null,
      error: 'Failed to fetch related data'
    }));
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const cacheKey = `bookings:all:page:${page}:limit:${limit}`;
    //kiểm tra cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log(`[Cache] MISS for ${cacheKey}`);
    const { rows, count } = await Appointment.findAndCountAll({
      include: [
        {
          model: ServiceCenter,
          as: 'serviceCenter', // Tên 'as' này phải khớp với model 'appointment.js' của bạn
          attributes: ['name'] // Chỉ lấy những trường cần thiết
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    const appointmentsWithDetails = await getAppointmentsDetails(rows);

    const responseData = {
      data: appointmentsWithDetails,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: BOOKING_LIST_TTL
    });
    res.status(200).json({
      data: rows,
      total: count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `booking:detail:${id}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json({ data: JSON.parse(cachedData) });
    }

    console.log(`[Cache] MISS for ${cacheKey}`);
    const appointment = await Appointment.findByPk(req.params.id, {
      include: {
        model: ServiceCenter,
        as: 'serviceCenter'
      }
    });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    await redisClient.set(cacheKey, JSON.stringify(appointment), {
      EX: BOOKING_DETAIL_TTL
    });
    const appointmentWithDetails = await getAppointmentDetails(appointment);
    res.status(200).json({
      data: appointmentWithDetails
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAppointmentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const cacheKey = `bookings:user:${userId}:page:${page}:limit:${limit}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log(`[Cache] MISS for ${cacheKey}`);
    const { rows, count } = await Appointment.findAndCountAll({
      where: { userId },
      include: {
        model: ServiceCenter,
        as: 'serviceCenter'
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const appointmentsWithDetails = await getAppointmentsDetails(rows);
    const responseData = {
      data: appointmentsWithDetails,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    };
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: BOOKING_LIST_TTL
    });
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy lịch rảnh (Availability)
 */
export const getAvailability = async (req, res) => {
    const { serviceCenterId, date } = req.query;
    if (!serviceCenterId || !date) {
    return res.status(400).json({ message: 'serviceCenterId và date là bắt buộc' });
    }

    const cacheKey = `availability:${serviceCenterId}:date:${date}`;
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json({ busySlots: JSON.parse(cachedData) });
      }
      console.log(`[Cache] MISS for ${cacheKey}`);
      const appointments = await Appointment.findAll({
        where: {
          serviceCenterId: serviceCenterId,
          date: date,
          status: { [Op.ne]: 'cancelled' }
        },
        attributes: ['timeSlot']
      });
      const bookedSlots = existingAppointments.map(app => app.timeSlot);
      const ALL_TIME_SLOTS = [
          '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
          '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
      ];
      const availableSlots = ALL_TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));

      const responseData = {
        data: availableSlots,
        message: 'Lấy lịch rảnh thành công'
      };
      await redisClient.set(cacheKey, JSON.stringify(responseData), {
        EX: AVAILABILITY_TTL // LƯU VÀO CACHE (với TTL ngắn)
      });
      res.status(200).json(responseData);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

export const createAppointment = async (req, res) => {
  const t = await sequelize.transaction(); 
  try {
    const { userId, createdById, vehicleId, serviceCenterId, date, timeSlot, notes } = req.body;
    if (!userId || !createdById || !vehicleId || !serviceCenterId || !date || !timeSlot) {
      await t.rollback(); 
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (userId, createdById, vehicleId, ...)' });
    }
    const vehicle = await vehicleClient.getVehicleById(vehicleId);
    if (!vehicle) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy Vehicle' });
    }
    
    const serviceCenter = await ServiceCenter.findByPk(serviceCenterId);
    if (!serviceCenter) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy ServiceCenter' });
    }

    // TẠO APPOINTMENT 
    const newAppointment = await Appointment.create({ 
      userId: userId,           
      createdById: createdById, 
      vehicleId: vehicleId,
      serviceCenterId: serviceCenterId,
      date: date,
      timeSlot: timeSlot,
      notes: notes,
      status: 'pending'          
    }, { 
      transaction: t              
    });
    const appointmentWithDetails = await getAppointmentDetails(newAppointment); 
    
    await notifyStaffNewAppointment(
      newAppointment,
      appointmentWithDetails.user,
      appointmentWithDetails.vehicle
    );

    const eventMessage = {
      type: 'APPOINTMENT_CREATED',
      payload: appointmentWithDetails
    };
    await publishToExchange('booking_events', eventMessage);
    
    // XÓA CACHE (Logic này của bạn đã tốt, chỉ sửa lại key)
    // Key cache 'Lịch rảnh'
    const availabilityCacheKey = `availability:date:${date}:center:${serviceCenterId}`; // (Hoặc key của bạn)
    await redisClient.del(availabilityCacheKey);
    
    // Xóa cache 'Thống kê'
    const statsCacheKey = getBookingStatsCacheKey();
    await redisClient.del(statsCacheKey);
    
    // Xóa cache danh sách (SỬA LỖI 4: Dùng userId gốc)
    await redisClient.del(`bookings:all:page:1:limit:10`);
    await redisClient.del(`bookings:user:${userId}:page:1:limit:10`); 

   
    await t.commit(); 

    res.status(201).json({
      data: appointmentWithDetails,
      message: 'Tạo lịch hẹn thành công'
    });

  } catch (err) {
    await t.rollback(); 
    res.status(500).json({ message: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const oldStatus = appointment.status;
    const newStatus = req.body.status;

    await appointment.update(req.body);
    const appointmentWithDetails = await getAppointmentDetails(appointment);

    if (newStatus && newStatus !== oldStatus) {
      await notifyCustomerStatusUpdate(
        appointment,
        appointmentWithDetails.user,
        oldStatus,
        newStatus
      );
    }
    // Luôn xóa cache chi tiết
    const detailCacheKey = `booking:detail:${req.params.id}`;
    await redisClient.del(detailCacheKey);
    console.log(`[Cache] DELETED ${detailCacheKey}`);

    // Nếu hủy lịch -> Xóa cache 'Lịch rảnh' và 'Thống kê'
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      const appointmentDate = new Date(appointment.appointmentTime).toISOString().split('T')[0];
      const availabilityCacheKey = `availability:date:${appointmentDate}:center:${appointment.serviceCenterId}`;
      await redisClient.del(availabilityCacheKey);
      console.log(`[Cache] DELETED ${availabilityCacheKey} (due to cancellation)`);

      const statsCacheKey = getBookingStatsCacheKey();
      await redisClient.del(statsCacheKey);
      console.log(`[Cache] DELETED ${statsCacheKey} (due to cancellation)`);
    }
    
    // (Tùy chọn: Xóa cache danh sách liên quan)
    await redisClient.del(`bookings:user:${appointment.userId}:page:1:limit:10`);

    res.status(200).json({
      data: appointmentWithDetails,
      message: 'Appointment updated successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // --- REDIS: - Phải xóa TRƯỚC khi xóa DB ---
    // (Hoặc lấy thông tin cần thiết trước)
    const detailCacheKey = `booking:detail:${req.params.id}`;
    const statsCacheKey = getBookingStatsCacheKey();
    const appointmentDate = new Date(appointment.appointmentTime).toISOString().split('T')[0];
    const availabilityCacheKey = `availability:date:${appointmentDate}:center:${appointment.serviceCenterId}`;
    const userListCacheKey = `bookings:user:${appointment.userId}:page:1:limit:10`;

    await appointment.destroy();

    // Xóa tất cả cache liên quan
    await redisClient.del(detailCacheKey);
    await redisClient.del(statsCacheKey);
    await redisClient.del(availabilityCacheKey);
    await redisClient.del(userListCacheKey);
    console.log(`[Cache] DELETED caches for booking ${req.params.id}`);

    res.status(200).json({
      message: 'Appointment deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Lấy thống kê
 */
export const getBookingStats = async (req, res) => {
  try {
    console.log('Start getBookingStats');

    const cacheKey = getBookingStatsCacheKey();

    // KIỂM TRA CACHE
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    // CACHE MISS -> LẤY TỪ DB
    console.log(`[Cache] MISS for ${cacheKey}`);
    const totalStats = await Appointment.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalBookings']
      ],
      where: { status: { [Op.ne]: 'cancelled' } },
      raw: true
    });

    // ... (Logic thống kê còn lại của bạn) ...
    const currentYear = new Date().getFullYear();
    const monthlyBookingStats = await Appointment.findAll({
      // ... (attributes, where, group, order)
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        },
        status: { [Op.ne]: 'cancelled' }
      },
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
      order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    const monthlyBookings = new Array(12).fill(0);
    monthlyBookingStats.forEach(stat => {
      const monthIndex = parseInt(stat.month) - 1;
      monthlyBookings[monthIndex] = parseInt(stat.count);
    });
    const result = totalStats[0] || {};
    const totalBookings = parseInt(result.totalBookings) || 0;
    const bookingStats = {
      totalBookings,
      monthlyBookings
    };
    
    const responseData = {
      data: bookingStats,
      message: 'Booking stats retrieved successfully'
    };

    //LƯU VÀO CACHE (với TTL dài)
    await redisClient.set(cacheKey, JSON.stringify(responseData), {
      EX: BOOKING_STATS_TTL
    });

    console.log('Booking stats result (from DB):', bookingStats);
    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error getting booking stats:', err);
    res.status(500).json({ message: 'Failed to get booking stats' });
  }
};

// (Hàm này dành cho client/index.js của finance-service)
export const getBookingStatsInternal = async (req, res) => {
  try {
    const stats = await getBookingStats(req, res); 
    res.status(200).json(stats.data); // Trả về data trực tiếp
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// (Hàm này dành cho client/index.js của finance-service)
export const getAllAppointmentsInternal = async (req, res) => {
  try {
    const result = await getAllAppointments(req, res); 
    res.status(200).json(result.data); // Trả về data trực tiếp
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// (Hàm này dành cho client/index.js của finance-service và workorder-service)
export const getAppointmentByIdInternal = async (req, res) => {
  try {
    const result = await getAppointmentById(req, res); // Hoặc copy logic vào đây
    res.status(200).json(result.data); // Trả về data trực tiếp
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// (Hàm này dành cho client/index.js của workorder-service)
export const getAppointmentsByUserIdInternal = async (req, res) => {
  try {
    const result = await getAppointmentsByUserId(req, res); 
    res.status(200).json(result.data); // Trả về data trực tiếp
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { statusMapping, notificationTypeMapping };