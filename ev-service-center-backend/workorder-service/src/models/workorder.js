import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const WorkOrder = sequelize.define('WorkOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  appointmentId: { type: DataTypes.INTEGER, allowNull: false },
  dueDate: { type: DataTypes.DATE },
  totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  createdById: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: true,
});

export default WorkOrder;
