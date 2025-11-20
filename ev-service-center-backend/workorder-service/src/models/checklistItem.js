import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import WorkOrder from './workOrder.js';

const ChecklistItem = sequelize.define('ChecklistItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  workOrderId: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  task: { type: DataTypes.STRING, allowNull: false },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  assignedToUserId: { type: DataTypes.INTEGER, allowNull: true },
  assignedAt: { type: DataTypes.DATE, allowNull: true },
});

WorkOrder.hasMany(ChecklistItem, { foreignKey: 'workOrderId', onDelete: 'CASCADE', as: 'checklistItems' });
ChecklistItem.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });

export default ChecklistItem;
