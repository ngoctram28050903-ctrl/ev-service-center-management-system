import express from 'express';
import sequelize from './config/db.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => res.send('🔔 Notification Service is running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected for Notification Service.');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

export default app;
