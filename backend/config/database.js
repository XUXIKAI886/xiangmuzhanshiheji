const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'user_permission_system',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  timezone: process.env.DB_TIMEZONE || '+08:00',
  
  // 连接池配置
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
  
  // 重连配置
  reconnect: true,
  idleTimeout: 300000, // 5分钟
  
  // SQL模式配置
  sql_mode: 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO',
  
  // 其他配置
  multipleStatements: false,
  namedPlaceholders: true,
  dateStrings: false,
  debug: process.env.NODE_ENV === 'development' ? ['ComQueryPacket'] : false
};

// 创建连接池
let pool = null;

/**
 * 创建数据库连接池
 */
function createPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    
    // 监听连接池事件
    pool.on('connection', (connection) => {
      logger.debug(`新的数据库连接建立: ${connection.threadId}`);
    });

    pool.on('error', (error) => {
      logger.error('数据库连接池错误:', error);
      if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        logger.info('重新创建数据库连接池');
        pool = null;
        createPool();
      }
    });

    logger.info('数据库连接池创建成功');
  }
  
  return pool;
}

/**
 * 获取数据库连接池
 */
function getPool() {
  if (!pool) {
    createPool();
  }
  return pool;
}

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    const connection = await getPool().getConnection();
    
    // 测试查询
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    
    // 释放连接
    connection.release();
    
    logger.info('数据库连接测试成功:', {
      test: rows[0].test,
      current_time: rows[0].current_time,
      host: dbConfig.host,
      database: dbConfig.database
    });
    
    return true;
  } catch (error) {
    logger.error('数据库连接测试失败:', error);
    throw error;
  }
}

/**
 * 执行查询
 * @param {string} sql SQL语句
 * @param {Array} params 参数数组
 * @returns {Promise} 查询结果
 */
async function query(sql, params = []) {
  const connection = await getPool().getConnection();
  
  try {
    const startTime = Date.now();
    const [rows, fields] = await connection.execute(sql, params);
    const duration = Date.now() - startTime;
    
    // 记录慢查询
    if (duration > 1000) {
      logger.warn('慢查询检测:', {
        sql: sql.substring(0, 200),
        duration: `${duration}ms`,
        params: params.length > 0 ? params : undefined
      });
    }
    
    return [rows, fields];
  } catch (error) {
    logger.error('数据库查询错误:', {
      sql: sql.substring(0, 200),
      params: params.length > 0 ? params : undefined,
      error: error.message
    });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 执行事务
 * @param {Function} callback 事务回调函数
 * @returns {Promise} 事务结果
 */
async function transaction(callback) {
  const connection = await getPool().getConnection();
  
  try {
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('事务执行失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 批量插入数据
 * @param {string} table 表名
 * @param {Array} columns 列名数组
 * @param {Array} values 值数组
 * @returns {Promise} 插入结果
 */
async function batchInsert(table, columns, values) {
  if (!values || values.length === 0) {
    throw new Error('批量插入数据不能为空');
  }

  const placeholders = columns.map(() => '?').join(',');
  const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
  
  const connection = await getPool().getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const valueSet of values) {
      const [result] = await connection.execute(sql, valueSet);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    logger.error('批量插入失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 分页查询
 * @param {string} sql 基础SQL语句
 * @param {Array} params 参数数组
 * @param {number} page 页码
 * @param {number} limit 每页数量
 * @returns {Promise} 分页结果
 */
async function paginate(sql, params = [], page = 1, limit = 20) {
  // 计算总数
  const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_table`;
  const [countResult] = await query(countSql, params);
  const total = countResult[0].total;
  
  // 计算分页
  const offset = (page - 1) * limit;
  const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
  const [rows] = await query(paginatedSql, [...params, limit, offset]);
  
  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}

/**
 * 关闭数据库连接池
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('数据库连接池已关闭');
  }
}

/**
 * 获取数据库状态信息
 */
async function getStatus() {
  try {
    const [connections] = await query('SHOW STATUS LIKE "Threads_connected"');
    const [maxConnections] = await query('SHOW VARIABLES LIKE "max_connections"');
    const [uptime] = await query('SHOW STATUS LIKE "Uptime"');
    
    return {
      connected: true,
      activeConnections: parseInt(connections[0].Value),
      maxConnections: parseInt(maxConnections[0].Value),
      uptime: parseInt(uptime[0].Value),
      poolConfig: {
        connectionLimit: dbConfig.connectionLimit,
        acquireTimeout: dbConfig.acquireTimeout,
        timeout: dbConfig.timeout
      }
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

// 初始化连接池
createPool();

module.exports = {
  pool: getPool(),
  query,
  transaction,
  batchInsert,
  paginate,
  testConnection,
  closePool,
  getStatus,
  
  // 导出配置供其他模块使用
  config: dbConfig
};
