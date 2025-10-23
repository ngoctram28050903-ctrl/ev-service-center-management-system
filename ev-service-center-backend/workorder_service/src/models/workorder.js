import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const WorkOrder = sequelize.define('WorkOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' },
  assignedTo: { type: DataTypes.STRING },
  dueDate: { type: DataTypes.DATE },
});

export default WorkOrder;