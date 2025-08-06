const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// 导入配置和工具
const logger = require('./utils/logger');
const { connectDatabase, testConnection } = require('./config/database');
const { connectRedis } = require('./config/redis');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const permissionRoutes = require('./routes/permissions');

// 导入中间件
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.weixin.qq.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

if (process.env.ENABLE_CORS === 'true') {
  app.use(cors(corsOptions));
}

// 限流配置
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过静态文件的限流
    return req.url.startsWith('/static/') || req.url.startsWith('/assets/');
  }
});

app.use('/api/', limiter);

// 请求日志中间件
app.use(requestLogger);

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/permissions', authMiddleware, permissionRoutes);

// 前端路由处理 - 服务静态HTML文件
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/waiting', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/waiting.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

// 404处理
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({ error: 'API端点不存在' });
  } else {
    res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
  }
});

// 错误处理中间件
app.use(errorHandler);

// 数据库连接和服务器启动
async function startServer() {
  try {
    // 测试数据库连接
    logger.info('正在连接数据库...');
    await testConnection();
    logger.info('数据库连接成功');

    // 连接Redis
    logger.info('正在连接Redis...');
    await connectRedis();
    logger.info('Redis连接成功');

    // 启动服务器
    const server = app.listen(PORT, () => {
      logger.info(`服务器启动成功`);
      logger.info(`环境: ${process.env.NODE_ENV}`);
      logger.info(`端口: ${PORT}`);
      logger.info(`访问地址: http://localhost:${PORT}`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('开发模式已启用');
        logger.info(`API文档: http://localhost:${PORT}/api/docs`);
      }
    });

    // 优雅关闭处理
    const gracefulShutdown = (signal) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭服务器...`);
      
      server.close(async () => {
        logger.info('HTTP服务器已关闭');
        
        try {
          // 关闭数据库连接
          const db = require('./config/database');
          if (db.pool) {
            await db.pool.end();
            logger.info('数据库连接已关闭');
          }

          // 关闭Redis连接
          const redis = require('./config/redis');
          if (redis.client) {
            await redis.client.quit();
            logger.info('Redis连接已关闭');
          }

          logger.info('服务器优雅关闭完成');
          process.exit(0);
        } catch (error) {
          logger.error('关闭服务器时发生错误:', error);
          process.exit(1);
        }
      });

      // 强制关闭超时
      setTimeout(() => {
        logger.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', reason);
      logger.error('Promise:', promise);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;
