import Appointment from '../models/appointment.js';
import ServiceCenter from '../models/serviceCenter.js';
import { userClient, vehicleClient, notificationClient } from '../client/index.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

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

    const { rows, count } = await Appointment.findAndCountAll({
      include: [{
        model: ServiceCenter,
        as: 'serviceCenter'
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    const appointmentsWithDetails = await getAppointmentsDetails(rows);

    res.status(200).json({
      data: appointmentsWithDetails,
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

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: {
        model: ServiceCenter,
        as: 'serviceCenter'
      }
    });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

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
    res.status(200).json({
      data: appointmentsWithDetails,
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

export const createAppointment = async (req, res) => {
  try {
    const vehicle = await vehicleClient.getVehicleById(req.body.vehicleId);
    const appointment = await Appointment.create({
      ...req.body,
      userId: vehicle.userId,
    });
    const appointmentWithDetails = await getAppointmentDetails(appointment);

    await notifyStaffNewAppointment(
      appointment,
      appointmentWithDetails.user,
      appointmentWithDetails.vehicle
    );

    res.status(201).json({
      data: appointmentWithDetails,
      message: 'Appointment created successfully'
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const oldStatus = appointment.status;

    await appointment.update(req.body);
    const appointmentWithDetails = await getAppointmentDetails(appointment);

    if (req.body.status && req.body.status !== oldStatus) {
      await notifyCustomerStatusUpdate(
        appointment,
        appointmentWithDetails.user,
        oldStatus,
        req.body.status
      );
    }

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

    await appointment.destroy();
    res.status(200).json({
      message: 'Appointment deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get basic booking statistics
export const getBookingStats = async (req, res) => {
  try {
    console.log('Start getBookingStats');

    const totalStats = await Appointment.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalBookings']
      ],
      where: {
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      raw: true
    });

    const currentYear = new Date().getFullYear();
    const monthlyBookingStats = await Appointment.findAll({
      attributes: [
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        },
        status: {
          [Op.ne]: 'cancelled'
        }
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

    console.log('Booking stats result:', bookingStats);

    res.status(200).json({
      data: bookingStats,
      message: 'Booking stats retrieved successfully'
    });
  } catch (err) {
    console.error('Error getting booking stats:', err);
    res.status(500).json({ message: 'Failed to get booking stats' });
  }
};

export { statusMapping, notificationTypeMapping };
