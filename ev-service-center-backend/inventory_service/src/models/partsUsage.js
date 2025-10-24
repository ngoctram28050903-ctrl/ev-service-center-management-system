import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Part from "./part.js";

const PartsUsage = sequelize.define("partsUsage", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  workOrderId: { type: DataTypes.INTEGER, allowNull: false },
  quantityUsed: { type: DataTypes.INTEGER, allowNull: false },
});

Part.hasMany(PartsUsage, { foreignKey: "partId" });
PartsUsage.belongsTo(Part, { foreignKey: "partId" });

export default PartsUsage;
