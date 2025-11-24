import express from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByUserId,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getBookingStats
} from '../controllers/bookingController.js';

const router = express.Router();

router.get('/', getAllAppointments);
router.get('/stats/booking', getBookingStats);
router.get('/user/:userId', getAppointmentsByUserId);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
