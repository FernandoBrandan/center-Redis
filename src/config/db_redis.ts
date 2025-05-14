import Redis from 'ioredis'
const url = process.env.REDIS_URL || 'redis://redis_cache:6379/0';
const redisClient = new Redis({ host: 'redis_cache', port: 6379 });
redisClient.on('connect', () => { console.log('Redis client connected') })
redisClient.on('ready', () => { console.log('Redis client ready') })
redisClient.on("error", (err) => console.error("Error:", err));
redisClient.on("end", () => console.log("Conexión cerrada"));
export default redisClient;