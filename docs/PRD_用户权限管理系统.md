# 呈尚策划用户权限管理系统 - 产品需求文档 (PRD)

## 1. 项目概述

### 1.1 项目背景
呈尚策划项目展示网站目前是一个静态网站，展示19个专业工具。为了保护内部资源和提升用户体验，需要实现完整的用户权限管理系统。

### 1.2 项目目标
- 实现微信扫码登录，提升用户体验
- 建立完善的用户权限管理体系
- 保护内部工具资源，防止未授权访问
- 提供管理员后台，便于用户和权限管理

### 1.3 项目范围
- 微信扫码登录系统
- 用户权限管理系统
- 管理员后台系统
- 前端权限控制中间件

## 2. 功能需求

### 2.1 微信扫码登录系统

#### 2.1.1 功能描述
用户通过微信扫码快速登录系统，获取基本用户信息。

#### 2.1.2 功能流程
1. 用户访问网站，显示微信登录二维码
2. 用户使用微信扫码
3. 微信授权后获取用户基本信息（昵称、头像、openid）
4. 系统自动注册或登录用户
5. 生成JWT token，用户进入系统

#### 2.1.3 技术要求
- 使用微信公众号网页授权
- 支持获取用户昵称、头像、openid
- 实现用户信息与系统账号绑定
- 安全的token生成和验证机制

### 2.2 用户权限管理系统

#### 2.2.1 用户状态管理
- **启用状态**：用户可正常登录和访问
- **禁用状态**：用户无法登录，已登录用户被强制退出
- **等待授权状态**：已登录但未获得访问权限

#### 2.2.2 权限类型
- **访问权限**：允许访问网站内容
- **管理权限**：允许访问管理后台

#### 2.2.3 权限操作
- 单个用户权限授予/撤销
- 批量用户权限操作
- 权限变更历史记录
- 权限到期自动处理

### 2.3 管理员后台系统

#### 2.3.1 管理员登录
- 传统用户名密码登录
- 登录验证码防暴力破解
- 登录状态保持
- 登录日志记录

#### 2.3.2 用户管理功能
- **用户列表**：分页显示、搜索筛选
- **用户详情**：基本信息、登录历史、权限状态
- **状态管理**：启用/禁用用户账号
- **批量操作**：批量启用/禁用、批量授权
- **统计分析**：用户注册趋势、活跃度分析

#### 2.3.3 权限管理功能
- **权限列表**：显示所有用户权限状态
- **权限授予**：为用户授予访问权限
- **权限撤销**：撤销用户访问权限
- **批量授权**：批量处理用户权限
- **权限历史**：权限变更记录和审计

#### 2.3.4 登录日志管理
- **登录记录**：时间、IP地址、设备信息
- **统计分析**：登录次数、活跃时段分析
- **异常监控**：异地登录、频繁登录提醒
- **数据导出**：支持Excel格式导出

### 2.4 前端权限控制

#### 2.4.1 页面访问控制
- 未登录用户自动跳转到登录页面
- 已登录但未授权用户显示等待授权页面
- 已授权用户正常访问网站内容

#### 2.4.2 用户状态显示
- 显示用户微信昵称和头像
- 显示当前权限状态
- 提供退出登录功能

## 3. 技术架构

### 3.1 技术栈选择

#### 3.1.1 后端技术栈
- **运行环境**：Node.js 18+
- **Web框架**：Express.js 4.x
- **数据库**：MySQL 8.0
- **缓存**：Redis 6.x
- **认证**：JWT (jsonwebtoken)
- **微信集成**：wechat-api

#### 3.1.2 前端技术栈
- **基础技术**：HTML5 + CSS3 + JavaScript ES6+
- **CSS框架**：Tailwind CSS 3.x
- **图标库**：Font Awesome 6.x
- **HTTP请求**：Fetch API

#### 3.1.3 开发工具
- **包管理**：npm
- **代码规范**：ESLint + Prettier
- **版本控制**：Git
- **API测试**：Postman

### 3.2 系统架构设计

#### 3.2.1 整体架构
```
前端页面 (HTML/CSS/JS)
    ↓
API网关 (Express.js)
    ↓
业务逻辑层 (Controllers/Services)
    ↓
数据访问层 (Models/DAO)
    ↓
数据存储 (MySQL + Redis)
```

#### 3.2.2 目录结构
```
project/
├── frontend/           # 前端文件
│   ├── index.html     # 主页面
│   ├── login.html     # 登录页面
│   ├── waiting.html   # 等待授权页面
│   └── admin/         # 管理后台
├── backend/           # 后端代码
│   ├── controllers/   # 控制器
│   ├── models/        # 数据模型
│   ├── middleware/    # 中间件
│   ├── routes/        # 路由
│   └── utils/         # 工具函数
├── docs/              # 文档
└── config/            # 配置文件
```

## 4. 数据库设计

### 4.1 核心数据表

#### 4.1.1 用户表 (users)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | INT | 主键 | AUTO_INCREMENT |
| openid | VARCHAR(64) | 微信唯一标识 | UNIQUE, NOT NULL |
| nickname | VARCHAR(100) | 微信昵称 | |
| avatar_url | VARCHAR(255) | 微信头像URL | |
| phone | VARCHAR(20) | 手机号 | |
| email | VARCHAR(100) | 邮箱 | |
| status | ENUM | 账号状态 | active/disabled |
| role | ENUM | 用户角色 | user/admin |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

#### 4.1.2 登录记录表 (login_logs)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | INT | 主键 | AUTO_INCREMENT |
| user_id | INT | 用户ID | FOREIGN KEY |
| login_time | TIMESTAMP | 登录时间 | DEFAULT CURRENT_TIMESTAMP |
| ip_address | VARCHAR(45) | 登录IP | |
| user_agent | TEXT | 设备信息 | |
| login_type | VARCHAR(20) | 登录方式 | wechat_scan |
| status | ENUM | 登录状态 | success/failed |

#### 4.1.3 权限表 (permissions)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | INT | 主键 | AUTO_INCREMENT |
| user_id | INT | 用户ID | FOREIGN KEY |
| permission_type | VARCHAR(20) | 权限类型 | access/admin |
| granted_by | INT | 授权人ID | FOREIGN KEY |
| granted_at | TIMESTAMP | 授权时间 | DEFAULT CURRENT_TIMESTAMP |
| expires_at | TIMESTAMP | 过期时间 | NULL |
| status | ENUM | 权限状态 | active/revoked |

#### 4.1.4 管理员表 (admins)
| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | INT | 主键 | AUTO_INCREMENT |
| username | VARCHAR(50) | 用户名 | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | 密码哈希 | NOT NULL |
| email | VARCHAR(100) | 邮箱 | |
| role | ENUM | 管理员角色 | super_admin/admin |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| last_login | TIMESTAMP | 最后登录 | |

### 4.2 索引设计
- users表：openid唯一索引
- login_logs表：user_id + login_time复合索引
- permissions表：user_id + permission_type复合索引

## 5. API接口设计

### 5.1 认证相关接口

#### 5.1.1 微信登录
- **接口**：POST /api/auth/wechat/login
- **参数**：{ code: "微信授权码" }
- **返回**：{ token: "JWT令牌", user: "用户信息" }

#### 5.1.2 权限检查
- **接口**：GET /api/auth/check
- **头部**：Authorization: Bearer {token}
- **返回**：{ valid: true, user: "用户信息", permissions: [] }

#### 5.1.3 退出登录
- **接口**：POST /api/auth/logout
- **头部**：Authorization: Bearer {token}
- **返回**：{ success: true }

### 5.2 用户管理接口

#### 5.2.1 获取用户列表
- **接口**：GET /api/admin/users
- **参数**：{ page: 1, limit: 20, search: "", status: "" }
- **返回**：{ users: [], total: 100, page: 1 }

#### 5.2.2 更新用户状态
- **接口**：PUT /api/admin/users/:id/status
- **参数**：{ status: "active/disabled" }
- **返回**：{ success: true }

### 5.3 权限管理接口

#### 5.3.1 授予权限
- **接口**：POST /api/admin/permissions
- **参数**：{ user_id: 1, permission_type: "access" }
- **返回**：{ success: true }

#### 5.3.2 撤销权限
- **接口**：DELETE /api/admin/permissions/:id
- **返回**：{ success: true }

## 6. 安全设计

### 6.1 认证安全
- JWT token设置合理过期时间（24小时）
- 实现token刷新机制
- 使用HTTPS协议传输
- 敏感信息使用环境变量存储

### 6.2 权限安全
- 实现基于角色的访问控制(RBAC)
- API接口权限验证中间件
- 管理员操作日志记录
- 防止权限提升攻击

### 6.3 数据安全
- 密码使用bcrypt加密存储
- SQL注入防护
- XSS攻击防护
- CSRF攻击防护

## 7. 性能要求

### 7.1 响应时间
- 登录接口响应时间 < 2秒
- 权限检查接口响应时间 < 500ms
- 页面加载时间 < 3秒

### 7.2 并发处理
- 支持100个并发用户同时在线
- 数据库连接池优化
- Redis缓存热点数据

## 8. 部署要求

### 8.1 服务器环境
- 操作系统：Ubuntu 20.04 LTS
- Node.js：18.x LTS
- MySQL：8.0
- Redis：6.x
- Nginx：反向代理和负载均衡

### 8.2 域名和SSL
- 配置HTTPS证书
- 微信授权域名配置
- CDN加速静态资源

## 9. 项目里程碑

### 9.1 第一阶段（1-2周）
- 环境搭建和数据库设计
- 基础项目架构搭建

### 9.2 第二阶段（2-3周）
- 微信登录系统开发
- 用户认证和权限控制

### 9.3 第三阶段（2-3周）
- 管理员后台开发
- 前端权限控制实现

### 9.4 第四阶段（1-2周）
- 系统测试和优化
- 部署和上线

## 10. 风险评估

### 10.1 技术风险
- 微信API变更风险：关注微信开发者文档更新
- 数据库性能风险：合理设计索引和查询优化

### 10.2 安全风险
- 用户数据泄露风险：实施严格的数据保护措施
- 权限绕过风险：多层权限验证机制

### 10.3 业务风险
- 用户体验风险：简化登录流程，提供清晰的权限说明
- 运维风险：建立完善的监控和备份机制
