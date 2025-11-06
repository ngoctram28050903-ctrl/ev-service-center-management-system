import express from 'express';
import sequelize from './config/db.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { connectRabbitMQ, consumeMessage } from "./utils/rabbitmq.js";
import { startNotificationConsumers } from "./consumers/notificationConsumers.js";

const app = express();
app.use(express.json());
app.use('/api/notification', notificationRoutes);

app.get('/', (req, res) => res.send('🔔 Notification Service is running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

(async () => {
  const channel = await connectRabbitMQ(process.env.RABBITMQ_URL);

  await consumeMessage("new_booking_created", (data) => {
    console.log("📩 Notification received:", data);
    // TODO: gửi email, push notification,...
  });
})();

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected for Notification Service.');
    await connectRabbitMQ(process.env.RABBITMQ_URL);
    await startNotificationConsumers();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
})();

export default app;
