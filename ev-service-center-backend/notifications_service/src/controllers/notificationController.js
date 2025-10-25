import Notification from '../models/notification.js';

//  Lấy tất cả thông báo
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Lấy thông báo theo user
export const getNotificationsByUser = async (req, res) => {
  try {
    const notifications = await Notification.findAll({ where: { userId: req.params.userId } });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Gửi thông báo mới
export const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//  Đánh dấu là đã đọc
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    await notification.update({ status: 'read' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Xóa thông báo
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    await notification.destroy();
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
