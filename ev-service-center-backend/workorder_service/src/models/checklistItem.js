import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import WorkOrder from './workorder.js'

const ChecklistItem = sequelize.define('ChecklistItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  workOrderId: { type: DataTypes.INTEGER, allowNull: false },
  task: { type: DataTypes.STRING, allowNull: false },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
});

WorkOrder.hasMany(ChecklistItem, { foreignKey: 'workOrderId', onDelete: 'CASCADE' });
ChecklistItem.belongsTo(WorkOrder, { foreignKey: 'workOrderId' });

export default ChecklistItem;
