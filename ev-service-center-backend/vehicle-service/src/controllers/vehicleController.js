import Vehicle from '../models/vehicle.js';
import Reminder from '../models/remider.js';
import { Op } from 'sequelize';

export const getAllVehicles = async (req, res) => {
  try {
    const { keyword, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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

    const { rows, count } = await Vehicle.findAndCountAll({
      where: whereClause,
      include: Reminder,
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

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, { include: Reminder });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(200).json({
      data: vehicle
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getVehiclesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { rows, count } = await Vehicle.findAndCountAll({
      where: { userId: parseInt(userId) },
      include: Reminder,
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

export const createVehicle = async (req, res) => {
  try {
    const newVehicle = await Vehicle.create(req.body);
    res.status(201).json({
      data: newVehicle,
      message: 'Vehicle created successfully'
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    await vehicle.update(req.body);
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
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    await vehicle.destroy();
    res.status(200).json({ 
      message: 'Vehicle deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addReminder = async (req, res) => {
  try {
    const reminder = await Reminder.create({
      vehicleId: req.params.vehicle_id,
      ...req.body,
    });
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
