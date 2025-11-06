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
} from '../controllers/vehicleController.js';

const router = express.Router();

router.get('/', getAllVehicles);
router.get('/user/:userId', getVehiclesByUserId);
router.get('/:id', getVehicleById);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

// Reminder endpoints
router.post('/:vehicle_id/reminders', addReminder);
router.get('/:vehicle_id/reminders', getReminders);

export default router;
