const redis = require("redis");
const process = require("process");
class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER,
      },
    });

    this._client.on("error", (error) => {
      console.error(error);
    });

    this._client.connect();
  }

  async set(key, value, expirationInSecond = 1800) {
    console.log(`Set key: ${key}, value: ${value}, expiration: ${expirationInSecond}`);
    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key, res) {
    const result = await this._client.get(key);
    // console.log(`Get key: ${key}, value: ${result}`);
    if (result === null) throw new Error("Cache tidak ditemukan");
    if (res) {
      console.log(res.headers)
      res.header('X-Data-Source', 'cache');
    }
    return result;
  }

  delete(key) {
    return this._client.del(key);
  }
}

module.exports = CacheService;
