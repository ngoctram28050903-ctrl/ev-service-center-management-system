import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: 'user_unique_username' },
  email: { type: DataTypes.STRING, allowNull: false, unique: 'user_unique_email' },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: "user" },
});
/**
 * @param {object} models - Đối tượng chứa tất cả các model đã được định nghĩa.
 */
User.associate = (models) => {
  User.hasMany(models.UserRole, {
    as: 'userRoles',
    foreignKey: 'userId',
  });

  User.belongsToMany(models.Role, {
    through: models.UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles' // Một bí danh khác
  });
};
export default User;
