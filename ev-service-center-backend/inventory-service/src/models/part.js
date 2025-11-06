import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Part = sequelize.define("Part", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  partNumber: { type: DataTypes.STRING, unique: true },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  minStock: { type: DataTypes.INTEGER, defaultValue: 5 },
});

export default Part;
