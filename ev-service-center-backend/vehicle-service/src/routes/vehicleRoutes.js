import express from 'express';
import {
  getAllVehicles,
  getVehicleById,
  getVehiclesByUserId,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  addReminder,
  getReminders,
  getVehicleByIdInternal
} from '../controllers/vehicleController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.get('/', [verifyToken, isAdmin], getAllVehicles);
router.get('/user/:userId', verifyToken, getVehiclesByUserId);
router.get('/:id', verifyToken, getVehicleById);
router.post('/', verifyToken, createVehicle);
router.put('/:id', verifyToken, updateVehicle);
router.delete('/:id', verifyToken, deleteVehicle);

// Reminder endpoints
router.post('/:vehicle_id/reminders', verifyToken, addReminder);
router.get('/:vehicle_id/reminders', verifyToken, getReminders);
router.get('/internal/:id', getVehicleByIdInternal);

export default router;
