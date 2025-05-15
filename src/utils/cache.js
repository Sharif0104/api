const redis = require('redis');

const client = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

client.connect().catch(console.error);

module.exports = {
  set: async (key, value, expiration) => {
    if (expiration) {
      await client.setEx(key, expiration, JSON.stringify(value));
    } else {
      await client.set(key, JSON.stringify(value));
    }
  },

  get: async (key) => {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },

  del: async (key) => {
    await client.del(key);
  },

  flushAll: async () => {
    await client.flushAll();
  }
};
