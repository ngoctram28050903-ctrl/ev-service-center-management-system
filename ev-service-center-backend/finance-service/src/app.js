import express from "express";
import bodyParser from "body-parser";
import sequelize from "./config/db.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import { connectRabbitMQ } from "./utils/rabbitmq.js";
import { startFinanceConsumers } from "./consumers/financeConsumers.js";


const app = express();
app.use(express.json());
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('💰 Finance Service is running'))
app.use("/api/finance", invoiceRoutes);
app.use("/api/invoice", invoiceRoutes);

(async () => {
  try {
    // 1. Kết nối Database
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected for Finance Service.');

    // 2. Kết nối RabbitMQ
    await connectRabbitMQ(process.env.RABBITMQ_URL);
    
    // 3. Khởi động Consumers
    await startFinanceConsumers();

  } catch (err) {
    console.error('❌ Failed to initialize Finance service:', err);
    process.exit(1);
  }
})();

export default app;
