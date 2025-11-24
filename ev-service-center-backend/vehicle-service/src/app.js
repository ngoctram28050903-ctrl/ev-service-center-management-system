import express from 'express';
import sequelize from './config/db.js';
import vehicleRoutes from './routes/vehicleRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/vehicle', vehicleRoutes);

app.get('/', (req, res) => res.send('🚗 Vehicle Service is running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected for Vehicle Service.');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

export default app;
