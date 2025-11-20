import express from 'express';
import {
  getAllNotifications,
  getNotifications,
  markAsRead,
  deleteNotification,
  createNotificationInternal
} from '../controllers/notificationController.js';
import { isAdmin } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.get('/', getNotifications);
router.get('/all', isAdmin, getAllNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
router.post('/internal', createNotificationInternal);

export default router;
