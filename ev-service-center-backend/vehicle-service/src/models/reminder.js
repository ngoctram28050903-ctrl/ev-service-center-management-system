import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Vehicle from './vehicle.js';

const Reminder = sequelize.define('Reminder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vehicleId: { type: DataTypes.INTEGER, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
});

Vehicle.hasMany(Reminder, { foreignKey: 'vehicleId', onDelete: 'CASCADE' });
Reminder.belongsTo(Vehicle, { foreignKey: 'vehicleId' });

export default Reminder;
