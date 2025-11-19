import express from 'express';
import {
  getAllNotifications,
  getNotifications,
  getNotificationsByUser,
  createNotification,
  markAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.get('/all', getAllNotifications);
router.get('/user/:userId', getNotificationsByUser);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
