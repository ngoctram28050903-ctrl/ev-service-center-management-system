import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Vehicle = sequelize.define('Vehicle', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  licensePlate: { type: DataTypes.STRING, allowNull: false, unique: true },
  brand: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING },
  year: { type: DataTypes.INTEGER },
  userId: { type: DataTypes.INTEGER, allowNull: false },
});

export default Vehicle;
