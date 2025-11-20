import express from 'express';
import sequelize from './config/db.js';
import bookingRoutes from './routes/bookingRoutes.js';
import serviceCenterRoutes from './routes/serviceCenterRoutes.js';
import { startBookingConsumers } from './consumers/bookingConsumers.js';
import { connectRabbitMQ } from "./utils/rabbitmq.js";

const app = express();
//connectQueue();
app.use(express.json());
app.use('/api/booking', bookingRoutes);
app.use('/api/service-center', serviceCenterRoutes);

app.get('/', (req, res) => res.send('📅 Booking Service is running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected for Booking Service.');
    await connectRabbitMQ(process.env.RABBITMQ_URL);
    await startBookingConsumers();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
})();

export default app;
