const redis = require('redis');
const logger = require('../utils/logger');

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  
  // 连接配置
  connectTimeout: 10000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  
  // 键前缀
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'ups:',
  
  // 其他配置
  enableReadyCheck: true,
  maxLoadingTimeout: 5000
};

let client = null;

/**
 * 创建Redis客户端
 */
function createClient() {
  if (!client) {
    // 构建Redis URL
    let redisUrl = `redis://`;
    if (redisConfig.password) {
      redisUrl += `:${redisConfig.password}@`;
    }
    redisUrl += `${redisConfig.host}:${redisConfig.port}/${redisConfig.db}`;

    client = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: redisConfig.connectTimeout,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis重连次数超过限制，停止重连');
            return new Error('Redis连接失败');
          }
          return Math.min(retries * 50, 1000);
        }
      },
      database: redisConfig.db
    });

    // 事件监听
    client.on('connect', () => {
      logger.info('Redis客户端连接中...');
    });

    client.on('ready', () => {
      logger.info('Redis客户端连接成功');
    });

    client.on('error', (error) => {
      logger.error('Redis连接错误:', error);
    });

    client.on('end', () => {
      logger.info('Redis连接已断开');
    });

    client.on('reconnecting', () => {
      logger.info('Redis正在重连...');
    });
  }

  return client;
}

/**
 * 连接Redis
 */
async function connectRedis() {
  try {
    const redisClient = createClient();
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis连接失败:', error);
    throw error;
  }
}

/**
 * 获取Redis客户端
 */
function getClient() {
  if (!client) {
    createClient();
  }
  return client;
}

/**
 * 生成带前缀的键名
 * @param {string} key 原始键名
 * @returns {string} 带前缀的键名
 */
function getKey(key) {
  return `${redisConfig.keyPrefix}${key}`;
}

/**
 * 设置缓存
 * @param {string} key 键名
 * @param {any} value 值
 * @param {number} ttl 过期时间（秒）
 * @returns {Promise} 设置结果
 */
async function set(key, value, ttl = 3600) {
  try {
    const redisClient = getClient();
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttl > 0) {
      await redisClient.setEx(getKey(key), ttl, serializedValue);
    } else {
      await redisClient.set(getKey(key), serializedValue);
    }
    
    logger.debug(`缓存设置成功: ${key}, TTL: ${ttl}s`);
    return true;
  } catch (error) {
    logger.error(`缓存设置失败: ${key}`, error);
    return false;
  }
}

/**
 * 获取缓存
 * @param {string} key 键名
 * @param {boolean} parseJson 是否解析JSON
 * @returns {Promise} 缓存值
 */
async function get(key, parseJson = true) {
  try {
    const redisClient = getClient();
    const value = await redisClient.get(getKey(key));
    
    if (value === null) {
      return null;
    }
    
    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    
    return value;
  } catch (error) {
    logger.error(`缓存获取失败: ${key}`, error);
    return null;
  }
}

/**
 * 删除缓存
 * @param {string} key 键名
 * @returns {Promise} 删除结果
 */
async function del(key) {
  try {
    const redisClient = getClient();
    const result = await redisClient.del(getKey(key));
    logger.debug(`缓存删除: ${key}, 结果: ${result}`);
    return result > 0;
  } catch (error) {
    logger.error(`缓存删除失败: ${key}`, error);
    return false;
  }
}

/**
 * 检查键是否存在
 * @param {string} key 键名
 * @returns {Promise} 是否存在
 */
async function exists(key) {
  try {
    const redisClient = getClient();
    const result = await redisClient.exists(getKey(key));
    return result === 1;
  } catch (error) {
    logger.error(`缓存检查失败: ${key}`, error);
    return false;
  }
}

/**
 * 设置过期时间
 * @param {string} key 键名
 * @param {number} ttl 过期时间（秒）
 * @returns {Promise} 设置结果
 */
async function expire(key, ttl) {
  try {
    const redisClient = getClient();
    const result = await redisClient.expire(getKey(key), ttl);
    return result === 1;
  } catch (error) {
    logger.error(`设置过期时间失败: ${key}`, error);
    return false;
  }
}

/**
 * 获取剩余过期时间
 * @param {string} key 键名
 * @returns {Promise} 剩余时间（秒）
 */
async function ttl(key) {
  try {
    const redisClient = getClient();
    return await redisClient.ttl(getKey(key));
  } catch (error) {
    logger.error(`获取过期时间失败: ${key}`, error);
    return -1;
  }
}

/**
 * 批量删除键
 * @param {string} pattern 键名模式
 * @returns {Promise} 删除数量
 */
async function deletePattern(pattern) {
  try {
    const redisClient = getClient();
    const keys = await redisClient.keys(getKey(pattern));
    
    if (keys.length === 0) {
      return 0;
    }
    
    const result = await redisClient.del(keys);
    logger.debug(`批量删除缓存: ${pattern}, 删除数量: ${result}`);
    return result;
  } catch (error) {
    logger.error(`批量删除缓存失败: ${pattern}`, error);
    return 0;
  }
}

/**
 * 哈希表操作 - 设置字段
 * @param {string} key 键名
 * @param {string} field 字段名
 * @param {any} value 值
 * @returns {Promise} 设置结果
 */
async function hSet(key, field, value) {
  try {
    const redisClient = getClient();
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await redisClient.hSet(getKey(key), field, serializedValue);
    return result;
  } catch (error) {
    logger.error(`哈希设置失败: ${key}.${field}`, error);
    return false;
  }
}

/**
 * 哈希表操作 - 获取字段
 * @param {string} key 键名
 * @param {string} field 字段名
 * @param {boolean} parseJson 是否解析JSON
 * @returns {Promise} 字段值
 */
async function hGet(key, field, parseJson = true) {
  try {
    const redisClient = getClient();
    const value = await redisClient.hGet(getKey(key), field);
    
    if (value === null) {
      return null;
    }
    
    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    
    return value;
  } catch (error) {
    logger.error(`哈希获取失败: ${key}.${field}`, error);
    return null;
  }
}

/**
 * 哈希表操作 - 删除字段
 * @param {string} key 键名
 * @param {string} field 字段名
 * @returns {Promise} 删除结果
 */
async function hDel(key, field) {
  try {
    const redisClient = getClient();
    const result = await redisClient.hDel(getKey(key), field);
    return result > 0;
  } catch (error) {
    logger.error(`哈希删除失败: ${key}.${field}`, error);
    return false;
  }
}

/**
 * 列表操作 - 左侧推入
 * @param {string} key 键名
 * @param {any} value 值
 * @returns {Promise} 列表长度
 */
async function lPush(key, value) {
  try {
    const redisClient = getClient();
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    return await redisClient.lPush(getKey(key), serializedValue);
  } catch (error) {
    logger.error(`列表推入失败: ${key}`, error);
    return 0;
  }
}

/**
 * 列表操作 - 右侧弹出
 * @param {string} key 键名
 * @param {boolean} parseJson 是否解析JSON
 * @returns {Promise} 弹出的值
 */
async function rPop(key, parseJson = true) {
  try {
    const redisClient = getClient();
    const value = await redisClient.rPop(getKey(key));
    
    if (value === null) {
      return null;
    }
    
    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    
    return value;
  } catch (error) {
    logger.error(`列表弹出失败: ${key}`, error);
    return null;
  }
}

/**
 * 获取Redis状态信息
 */
async function getStatus() {
  try {
    const redisClient = getClient();
    const info = await redisClient.info();
    const dbSize = await redisClient.dbSize();
    
    return {
      connected: redisClient.isReady,
      dbSize,
      info: info.split('\r\n').reduce((acc, line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          acc[key] = value;
        }
        return acc;
      }, {}),
      config: redisConfig
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * 关闭Redis连接
 */
async function closeConnection() {
  if (client) {
    await client.quit();
    client = null;
    logger.info('Redis连接已关闭');
  }
}

// 缓存工具类
class CacheManager {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  getKey(key) {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  async set(key, value, ttl = 3600) {
    return set(this.getKey(key), value, ttl);
  }

  async get(key, parseJson = true) {
    return get(this.getKey(key), parseJson);
  }

  async del(key) {
    return del(this.getKey(key));
  }

  async exists(key) {
    return exists(this.getKey(key));
  }
}

module.exports = {
  client: getClient(),
  connectRedis,
  getClient,
  closeConnection,
  getStatus,
  
  // 基础操作
  set,
  get,
  del,
  exists,
  expire,
  ttl,
  deletePattern,
  
  // 哈希表操作
  hSet,
  hGet,
  hDel,
  
  // 列表操作
  lPush,
  rPop,
  
  // 工具类
  CacheManager,
  
  // 导出配置
  config: redisConfig
};
