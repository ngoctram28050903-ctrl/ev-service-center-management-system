import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const UserRole = sequelize.define("UserRole", {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users', 
      key: 'id'
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Roles', 
      key: 'id'
    }
  }
});
/**
 * Định nghĩa các mối quan hệ (associations).
 * @param {object} models - Đối tượng chứa tất cả các model.
 */
UserRole.associate = (models) => {
  // Bảng trung gian này THUỘC VỀ (belongsTo) một User
  UserRole.belongsTo(models.User, {
    foreignKey: 'userId',
  });

  // Bảng trung gian này THUỘC VỀ (belongsTo) một Role
  UserRole.belongsTo(models.Role, {
    foreignKey: 'roleId',
    as: 'role' // Bí danh 'role' này khớp với authController
  });
};
export default UserRole;