import express from 'express';
import sequelize from './config/db.js';
import workOrderRoutes from './routes/workOrderRoutes.js';
import { connectRabbitMQ } from "./utils/rabbitmq.js";
import { startWorkOrderConsumers } from "./consumers/workorderConsumers.js";

const app = express();
app.use(express.json());

app.use('/api/workorder', workOrderRoutes);

app.get('/', (req, res) => res.send('🧾 WorkOrder Service is running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected for WorkOrder Service.');
    await connectRabbitMQ(process.env.RABBITMQ_URL);
    await startWorkOrderConsumers();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
})();

export default app;
