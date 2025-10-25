import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Invoice = sequelize.define("Invoice", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM("unpaid", "paid", "cancelled"), defaultValue: "unpaid" },
  dueDate: { type: DataTypes.DATE, allowNull: false },
});

export default Invoice;
