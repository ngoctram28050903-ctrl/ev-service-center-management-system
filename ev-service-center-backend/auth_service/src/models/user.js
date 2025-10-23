import { DataTpyes } from "sequelize";
import seqelize from  "../config/db.js";

const User = sequlize.define("User", {
    id: { type: DataTpyes.INTEGER, primary: true, autoIncrement: true },
    username: { type: DataTpyes.STRING, allowNull: false, unique: true },
    email: { type: DataTpyes.STRING, allowNull: false, unique: true },
    password: { type: DataTpyes.STRING, allowNull: false },
    role: { type: DataTpyes.STRING, defaultValue: "User" },
});

export default User;