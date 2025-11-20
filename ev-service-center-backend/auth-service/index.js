import app, { initializeService } from './src/app.js';
import http from 'http';

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// Hàm main để khởi động
const startServer = async () => {
  try {
    //  Chạy logic khởi tạo (DB, RabbitMQ, Associations, v.v.)
    console.log('Bắt đầu khởi tạo dịch vụ (DB, RabbitMQ)...');
    await initializeService();
    console.log('!!! Khởi tạo dịch vụ thành công.');

    //  CHỈ SAU KHI init xong, mới chạy server
    server.listen(PORT, () => {
      // Log này sẽ chỉ xuất hiện 1 LẦN, SAU KHI DB connect
      console.log(`🚀 Auth Service running on port ${PORT}`); 
    });

  } catch (error) {
    console.error('❌ Không thể khởi động server:', error);
    process.exit(1);
  }
};

// Chạy hàm main
startServer();