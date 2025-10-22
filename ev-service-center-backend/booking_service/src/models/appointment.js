import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import ServiceCenter from './serviceCenter.js';

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  serviceCenterId: { type: DataTypes.INTEGER, allowNull: false },
  vehicleId: { type: DataTypes.INTEGER },
  date: { type: DataTypes.DATE, allowNull: false },
  timeSlot: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending | confirmed | cancelled
  notes: { type: DataTypes.STRING },
}, {
  timestamps: true,
});

// Thiết lập quan hệ
ServiceCenter.hasMany(Appointment, { foreignKey: 'serviceCenterId' });
Appointment.belongsTo(ServiceCenter, { foreignKey: 'serviceCenterId' });

export default Appointment;
