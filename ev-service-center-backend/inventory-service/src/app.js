import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectRabbitMQ } from "./utils/rabbitmq.js";
import { startInventoryConsumers } from "./consumers/inventoryConsumers.js";
import sequelize from "./config/db.js";
import partRoutes from "./routes/partRoutes.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/inventory/parts", partRoutes);
app.get('/', (req, res) => res.send('📦 Inventory Service is running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

(async () => {
  try {
    // 1. Kết nối Database
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected for Inventory Service.');

    // 2. Kết nối RabbitMQ
    await connectRabbitMQ(process.env.RABBITMQ_URL); 
    
    // 3. Khởi động Consumers
    await startInventoryConsumers();

  } catch (err) {
    console.error('❌ Failed to initialize Inventory service:', err);
    process.exit(1);
  }
})();

export default app;
