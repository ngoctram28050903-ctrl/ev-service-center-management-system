import { DataTypes } from "sequelize";
import seqelize from "../config/db.js";

const Role = seqelize.define("Role", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
});

export default Role;