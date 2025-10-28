import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";

const Invoice = sequelize.define("Invoice", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM("pending", "paid", "overdue", "cancelled"), defaultValue: "pending" },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  appointmentId: { type: DataTypes.INTEGER, allowNull: true },
});

export default Invoice;
