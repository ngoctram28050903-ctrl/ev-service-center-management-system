import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ServiceCenter = sequelize.define('ServiceCenter', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
}, {
  timestamps: true,
});

export default ServiceCenter;
