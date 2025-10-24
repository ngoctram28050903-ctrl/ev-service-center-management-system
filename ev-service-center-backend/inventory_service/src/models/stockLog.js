import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Part from "./part.js";

const StockLog = sequelize.define("stockLog", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  changeType: { type: DataTypes.ENUM("IN", "OUT"), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
});

Part.hasMany(StockLog, { foreignKey: "partId" });
StockLog.belongsTo(Part, { foreignKey: "partId" });

export default StockLog;
