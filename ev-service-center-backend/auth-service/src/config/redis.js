import { createClient } from 'redis';
import 'dotenv/config'; 


const redisUrl = process.env.REDIS_URL || 'redis://redis-cache:6379';

const redisClient = createClient({
    url: redisUrl
});

redisClient.on('connect', () => {
    console.log('[Redis] Connected to Redis server...');
});

redisClient.on('error', (err) => {
    console.error('[Redis] Redis Client Error', err);
});

// Kết nối ngay lập tức khi ứng dụng khởi động
// Sử dụng IIFE (Immediately Invoked Function Expression)
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('[Redis] Failed to connect:', err);
    }
})();

export default redisClient;