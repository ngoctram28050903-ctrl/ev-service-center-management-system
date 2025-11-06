import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectRabbitMQ } from "./utils/rabbitmq.js"; 
import sequelize from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);

(async () => {
  try {
    // 1. Kết nối Database
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected for Auth Service.');

    // 2. Kết nối RabbitMQ
    await connectRabbitMQ(process.env.RABBITMQ_URL); 

  } catch (err) {
    console.error('❌ Failed to initialize Auth service:', err);
    process.exit(1); // Thoát nếu không thể kết nối
  }
})();

export default app;