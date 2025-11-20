import Notification from '../models/notification.js';

export const getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Notification.findAndCountAll({
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

export const getNotifications = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    if (!loggedInUserId) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const whereClause = {userId: loggedInUserId};
    
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    
    const { rows, count } = await Notification.findAndCountAll({
      where: whereClause,
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


export const markAsRead = async (req, res) => {
  try {
    const loggedInUserId = req.user.id; 
    if (!loggedInUserId) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }

    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    // Chỉ chủ sở hữu mới được đánh dấu đã đọc
    if (notification.userId !== loggedInUserId) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    await notification.update({ status: 'read' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    if (!loggedInUserId) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }

    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    // Chỉ chủ sở hữu mới được xóa
    if (notification.userId !== loggedInUserId) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    await notification.destroy();
    res.json({ message: 'Đã xóa thông báo' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createNotificationInternal = async (req, res) => {
  try {
    const { userId, message, link } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ message: 'Missing userId or message' });
    }

    const newNotification = await Notification.create({
      userId,
      message,
      link,
      status: 'unread'
    });
    res.status(201).json(newNotification); 

  } catch (err) {
    console.error("!!! LỖI TRONG HÀM createNotificationInternal:", err);
    res.status(500).json({ message: err.message });
  }
};
