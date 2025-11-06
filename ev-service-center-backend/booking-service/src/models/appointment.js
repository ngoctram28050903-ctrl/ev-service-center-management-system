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
  status: { 
    type: DataTypes.STRING, 
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'confirmed', 'cancelled', 'completed']]
    }
  }, // pending | confirmed | cancelled | completed
  notes: { type: DataTypes.STRING },
  createdById: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: true,
});

ServiceCenter.hasMany(Appointment, { foreignKey: 'serviceCenterId', as: 'appointments' });
Appointment.belongsTo(ServiceCenter, { foreignKey: 'serviceCenterId', as: 'serviceCenter' });

export default Appointment;
