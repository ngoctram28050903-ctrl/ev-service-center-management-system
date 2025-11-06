import amqp from "amqplib";

let connection;
let channel;

/**
 * Kết nối tới RabbitMQ. Sẽ tự động thử lại nếu thất bại.
 */
export const connectRabbitMQ = async (url) => {
  try {
    if (!connection) {
      connection = await amqp.connect(url);
      channel = await connection.createChannel();
      console.log("✅ Đã kết nối tới RabbitMQ");
    }
    return channel;
  } catch (error) {
    console.error("❌ Kết nối RabbitMQ thất bại:", error.message);
    setTimeout(() => connectRabbitMQ(url), 5000); // Thử lại sau 5 giây
  }
};

// --- CÁC HÀM CŨ (Dùng cho 1-1) ---

/**
 * Gửi tin nhắn đến một Hàng đợi (Queue) cụ thể.
 * Chỉ MỘT consumer sẽ nhận được tin nhắn này.
 */
export const publishMessage = async (queue, message) => {
  if (!channel) {
    console.error("❌ Kênh RabbitMQ chưa sẵn sàng");
    return;
  }
  try {
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`📤 Đã gửi tin nhắn tới Queue [${queue}]:`, message);
  } catch (error) {
    console.error(`❌ Gửi tới Queue [${queue}] thất bại:`, error.message);
  }
};

/**
 * Lắng nghe (Consume) từ một Hàng đợi (Queue) cụ thể.
 */
export const consumeMessage = async (queue, callback) => {
  if (!channel) {
    console.error("❌ Kênh RabbitMQ chưa sẵn sàng");
    return;
  }
  try {
    await channel.assertQueue(queue, { durable: true });
    console.log(`📥 Đang lắng nghe Queue: [${queue}]`);
    
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          callback(data); // Gọi hàm callback với dữ liệu đã parse
          channel.ack(msg); // Báo đã xử lý xong
        } catch (e) {
          console.error("❌ Lỗi xử lý tin nhắn (JSON parse?):", e.message);
          channel.nack(msg, false, false); // Từ chối tin nhắn (không re-queue)
        }
      }
    });
  } catch (error) {
    console.error(`❌ Lỗi khi đăng ký Queue [${queue}]:`, error.message);
  }
};


// --- CÁC HÀM MỚI (Pub/Sub 1-Nhiều) ---

/**
 * Phát sóng tin nhắn đến một Sàn giao dịch (Exchange).
 * TẤT CẢ consumer đăng ký sẽ nhận được.
 */
export const publishToExchange = async (exchangeName, message) => {
  if (!channel) {
    console.error("❌ Kênh RabbitMQ chưa sẵn sàng");
    return;
  }
  try {
    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    // Gửi tin nhắn đến exchange, không cần routing key
    channel.publish(exchangeName, '', Buffer.from(JSON.stringify(message)));
    console.log(` BROADCAST tới Exchange [${exchangeName}]:`, message);
  } catch (error) {
    console.error(`❌ Gửi tới Exchange [${exchangeName}] thất bại:`, error.message);
  }
};

/**
 * Lắng nghe từ một Sàn giao dịch (Exchange).
 * Sẽ tạo một queue tạm thời, duy nhất cho service này.
 */
export const subscribeToExchange = async (exchangeName, callback) => {
  if (!channel) {
    console.error("❌ Kênh RabbitMQ chưa sẵn sàng");
    return;
  }
  try {
    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    // Tạo một queue tạm thời, không bền (exclusive: true)
    // Queue này sẽ tự động bị xóa khi service disconnect
    const q = await channel.assertQueue('', { exclusive: true });
    
    // Gắn (bind) queue tạm thời này vào Exchange
    await channel.bindQueue(q.queue, exchangeName, '');
    
    console.log(`📥 Đã đăng ký Exchange [${exchangeName}], lắng nghe trên queue [${q.queue}]`);

    // Bắt đầu lắng nghe trên queue tạm thời đó
    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          callback(data); // Gọi hàm callback
        } catch (e) {
          console.error("❌ Lỗi xử lý tin nhắn (JSON parse?):", e.message);
        }
        // Tự động ack vì queue là tạm thời
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error(`❌ Lỗi khi đăng ký Exchange [${exchangeName}]:`, error.message);
  }
};