import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Invoice from "./invoice.js";

const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  invoiceId: { type: DataTypes.INTEGER, allowNull: false },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  method: { type: DataTypes.ENUM("cash", "credit_card", "bank_transfer"), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
});

Invoice.hasMany(Payment, { foreignKey: "invoiceId" });
Payment.belongsTo(Invoice, { foreignKey: "invoiceId" });

export default Payment;
