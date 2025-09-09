import redis from 'redis'

export const redisClient = redis.createClient({ url: "redis://localhost:6379" });
redisClient.on('error', err => console.log('Redis Client Error', err));