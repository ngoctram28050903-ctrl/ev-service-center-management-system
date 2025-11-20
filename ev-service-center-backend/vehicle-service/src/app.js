import express from 'express';
import cors from 'cors'; 
import sequelize from './config/db.js';
import { connectRabbitMQ } from "./utils/rabbitmq.js"; 
import vehicleRoutes from './routes/vehicleRoutes.js';

import Vehicle from './models/vehicle.js'
import Reminder from './models/reminder.js';

const app = express();
app.use(cors()); // Thêm cors
app.use(express.json());
app.use('/api/vehicle', vehicleRoutes);

app.get('/', (req, res) => res.send('🚗 Vehicle Service is running'));
app.get('/health', (req, res) => res.json({ status: 'ok' })); 

console.log("Đang khởi tạo các mối quan hệ (associations) cho vehicle-service...");
const models = {
  Vehicle,
  Reminder
};

Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

console.log("!!! Các mối quan hệ (associations) của vehicle-service đã được khởi tạo.");

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected for Vehicle Service.');
    
    await sequelize.sync({ alter: true }); 
    console.log('✅ Database synced for Vehicle Service.');
    
    await connectRabbitMQ(process.env.RABBITMQ_URL); 
    
  } catch (err) {
    console.error('❌ Failed to initialize Vehicle service:', err); // Sửa log
    process.exit(1);
  }
})();

export default app;