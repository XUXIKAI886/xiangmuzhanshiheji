# CLAUDE.md

本文件为Claude Code (claude.ai/code) 在此仓库中工作提供指导。

**重要提示：所有回复必须使用中文。**

## 项目概述

这是一个复合项目，包含两个主要部分：

1. **呈尚策划展示网站**（主项目）：展示20个美团外卖和闪购运营相关工具的静态展示网站
2. **用户权限管理系统**（后端服务）：基于Express.js和MySQL的用户权限管理后端API

## 项目架构

### 主项目：展示网站
- **单页应用**：所有内容都包含在 `index.html` 中
- **技术栈**：
  - HTML5语义化结构
  - Tailwind CSS框架（CDN）
  - 原生JavaScript用于交互
  - Font Awesome图标库（CDN）
- **设计模式**：基于卡片的响应式网格布局

### 后端项目：用户权限管理系统
- **技术栈**：
  - Node.js + Express.js
  - MySQL数据库
  - Redis缓存
  - JWT身份认证
  - 微信登录集成
- **架构模式**：RESTful API服务
- **部署**：支持Docker容器化部署

## 项目结构

```
├── index.html              # 主展示网站文件
├── README.md               # 项目文档
├── CLAUDE.md              # 本指导文档
├── backend/               # 用户权限管理系统后端
│   ├── app.js             # Express应用入口
│   ├── package.json       # Node.js项目配置
│   ├── config/           # 数据库和Redis配置
│   ├── routes/           # API路由定义
│   ├── middleware/       # 中间件
│   ├── services/         # 业务逻辑服务
│   └── utils/            # 工具函数
├── docs/                  # 项目文档目录
│   ├── 技术架构设计文档.md
│   ├── 数据库设计文档.md
│   └── PRD_用户权限管理系统.md
└── xiangmuzhanshiheji/   # 嵌套的展示网站副本
```

## 开发命令

### 主项目（展示网站）
静态HTML项目，无需构建系统：

```bash
# 本地服务（任意方法）
python -m http.server
# 或
npx serve
# 或直接在浏览器中打开index.html
```

### 后端项目（用户权限管理系统）
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 开发模式运行（自动重启）
npm run dev

# 生产模式运行
npm start

# 运行测试
npm test
npm run test:watch

# 代码质量检查
npm run lint
npm run lint:fix
npm run format

# 数据库迁移和种子数据
npm run migrate
npm run seed

# Docker部署
npm run docker:build
npm run docker:run
```

## 核心组件

### 前端组件（展示网站）

#### 项目卡片系统
每个项目以卡片组件形式展示，包含：
- 渐变背景头部 (`h-32`)
- Font Awesome图标表示
- 项目标题和类别标签
- 描述文本和功能标签
- 悬停动画和3D效果

#### 分类筛选系统
- 支持按部门筛选：运营专用(11个)、美工专用(2个)、销售专用(2个)、人事专用(4个)、客服专用(1个)
- 动态计数显示
- 响应式标签设计

#### 响应式设计
- 网格布局：1列（移动端）→ 2列（平板）→ 3列（桌面）
- 卡片间距：`gap-8` 以优化浏览体验
- 优化的移动端导航布局

### 后端架构组件

#### 认证系统
- JWT token管理
- 微信登录集成
- 会话管理（Redis）
- 权限验证中间件

#### 数据层
- MySQL数据库连接池
- Redis缓存服务
- 数据模型和关系映射
- 连接健康检查

#### API路由结构
- `/api/auth/*` - 认证相关接口
- `/api/users/*` - 用户管理接口  
- `/api/admin/*` - 管理员接口
- `/api/permissions/*` - 权限管理接口

#### 中间件系统
- 错误处理中间件
- 请求日志记录
- 速率限制保护
- CORS和安全头设置

## 内容管理

### 展示网站项目管理
#### 添加新项目卡片
1. 从 `index.html` 复制现有卡片结构
2. 更新关键属性：
   - `data-category` - 设置分类（operation/design/sales/hr/service）
   - `data-title` - 项目标题（用于搜索）
   - `data-tags` - 功能标签（用于搜索）
   - `href` - 项目链接URL
3. 更新视觉元素：
   - 渐变背景色 `from-{color}-100 to-{color}-100`
   - Font Awesome图标类
   - 项目标题、描述和标签

#### 配色方案规则
- **运营专用**：蓝色、绿色、黄色、红色、青色系列
- **美工专用**：紫色、橙色系列  
- **销售专用**：粉色、翠绿色系列
- **人事专用**：绿色、靛蓝、玫瑰、天蓝色系列
- **客服专用**：青色系列

### 后端API管理
#### 环境配置
后端项目需要以下环境变量（`.env`文件）：
```bash
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=user_permission_system
DB_USER=your_username
DB_PASS=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 微信配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
```

## 技术要求

### 前端（展示网站）
- 支持CSS Grid和Flexbox的现代浏览器
- CDN依赖项 (Tailwind CSS, Font Awesome)
- 无需构建过程，直接运行

### 后端（用户权限系统）
- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0
- 支持Docker容器化部署

## 性能优化

### 前端优化
- 外部CDN资源加载优化
- 最小化JavaScript代码量
- 使用图标和渐变的无图片设计
- 单HTML文件减少网络请求

### 后端优化
- Redis缓存减少数据库查询
- 连接池管理数据库连接
- 请求速率限制防止滥用
- 压缩中间件减少响应体积