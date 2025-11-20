import express from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByUserId,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getBookingStats,
  getAvailability,
  getBookingStatsInternal,
  getAllAppointmentsInternal,
  getAppointmentByIdInternal,
  getAppointmentsByUserIdInternal
} from '../controllers/bookingController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.get('/availability', getAvailability);
router.get('/', verifyToken, isAdmin, getAllAppointments);
router.get('/stats/booking', verifyToken, isAdmin, getBookingStats);
router.delete('/:id', verifyToken, isAdmin, deleteAppointment);
router.get('/:id', verifyToken, getAppointmentById);
router.post('/', verifyToken, createAppointment);
router.put('/:id', verifyToken, updateAppointment);
router.get('/user/:userId', verifyToken, getAppointmentsByUserId);
router.delete('/:id', deleteAppointment);
router.get('/internal/stats/booking', getBookingStatsInternal);
router.get('/internal', getAllAppointmentsInternal);
router.get('/internal/:id', getAppointmentByIdInternal);
router.get('/internal/user/:id', getAppointmentsByUserIdInternal);

export default router;
