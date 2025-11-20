import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectRabbitMQ } from "./utils/rabbitmq.js"; 
import sequelize from "./config/db.js";
import Role from "./models/role.js";
import authRoutes from "./routes/authRoutes.js";
import User from "./models/user.js";
import UserRole from "./models/userRole.js";
import RefreshToken from "./models/refreshToken.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.get("/health", (req, res) => res.status(200).send("OK"));

console.log("Đang khởi tạo các mối quan hệ (associations)...");
const models = {
  User,
  Role,
  UserRole,
  RefreshToken
};
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));
console.log("!!! Các mối quan hệ (associations) đã được khởi tạo thành công.");


const seedRoles = async () => {
  try {
    const [userRole, userCreated] = await Role.findOrCreate({ where: { name: 'user' }, defaults: { name: 'user' } });
    const [adminRole, adminCreated] = await Role.findOrCreate({ where: { name: 'admin' }, defaults: { name: 'admin' } });
    const [staffRole, staffCreated] = await Role.findOrCreate({ where: { name: 'staff' }, defaults: { name: 'staff' } });

    if (userCreated) console.log('✅ Đã tạo vai trò "user".');
    if (adminCreated) console.log('✅ Đã tạo vai trò "admin".');
    if (staffCreated) console.log('✅ Đã tạo vai trò "staff".');
  } catch (err) {
    console.error("❌ Lỗi khi seed vai trò:", err);
  }
};

// (Chúng ta export hàm này để index.js gọi)
export const initializeService = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected for Auth Service.');
    await sequelize.sync({ alter: true }); 
    console.log('✅ Database synced.');
    await seedRoles();
    await connectRabbitMQ(process.env.RABBITMQ_URL); 
  } catch (err) {
    console.error('❌ Failed to initialize Auth service:', err);
    process.exit(1); 
  }
};

export default app; 