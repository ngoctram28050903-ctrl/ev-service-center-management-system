import express from 'express';
import {
  getAllNotifications,
  getNotificationsByUser,
  createNotification,
  markAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getAllNotifications);
router.get('/user/:userId', getNotificationsByUser);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
