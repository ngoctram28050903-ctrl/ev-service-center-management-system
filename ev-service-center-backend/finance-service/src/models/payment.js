import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";
import Invoice from "./invoice.js";

const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  invoiceId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paymentMethod: { type: DataTypes.ENUM("cash", "bank_transfer"), allowNull: false, defaultValue: "cash" },
  transactionId: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.ENUM("pending", "success", "failed", "refunded"), allowNull: false },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  note: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: "Payments",
  timestamps: true,
});

Invoice.hasMany(Payment, { foreignKey: "invoiceId" });
Payment.belongsTo(Invoice, { foreignKey: "invoiceId" });

export default Payment;
