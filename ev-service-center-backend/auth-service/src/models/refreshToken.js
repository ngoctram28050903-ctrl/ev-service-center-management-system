import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.js";

const RefreshToken = sequelize.define("RefreshToken", {
  token: { type: DataTypes.STRING, allowNull: false },
  expiryDate: { type: DataTypes.DATE, allowNull: false },
});

User.hasMany(RefreshToken, { foreignKey: "userId" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

export default RefreshToken;
