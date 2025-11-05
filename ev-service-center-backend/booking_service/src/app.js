import express from 'express';
import sequelize from './config/db.js';
import bookingRoutes from './routes/bookingRoutes.js';
import serviceCenterRoutes from './routes/serviceCenterRoutes.js';

const app = express();
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
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

export default app;
