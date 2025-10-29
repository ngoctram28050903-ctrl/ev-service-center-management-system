import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false }, // Ví dụ: booking, reminder, etc.
  status: { type: DataTypes.STRING, defaultValue: 'unread' }, // unread | read
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

export default Notification;
