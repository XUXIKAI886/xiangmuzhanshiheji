# CLAUDE.md

本文件为Claude Code (claude.ai/code) 在此仓库中工作提供指导。

**重要提示：所有回复必须使用中文。**

## 项目概述

这是一个呈尚策划的静态展示网站，展示19个与美团外卖和闪购运营相关的操作工具和系统。该网站是使用现代网络技术构建的单页HTML应用程序。

## 架构

- **单页应用**：所有内容都包含在 `index.html` 中
- **技术栈**：
  - HTML5语义化结构
  - Tailwind CSS框架用于样式
  - 原生JavaScript用于交互
  - Font Awesome图标库
- **设计模式**：基于卡片的响应式网格布局
- **CSS架构**：内联样式结合Tailwind实用类

## 项目结构

- `index.html` - 主应用文件，包含所有HTML、CSS和JavaScript
- `README.md` - 包含项目详情和版本历史的综合文档

## 开发命令

这是一个静态HTML项目，无需构建系统。开发方式：

```bash
# 本地服务（任意方法）
python -m http.server
# 或
npx serve
# 或直接在浏览器中打开index.html
```

## 核心组件

### 项目卡片
每个项目以卡片组件形式展示，包含：
- 渐变背景头部 (`h-36`)
- 图标表示 (Font Awesome)
- 项目标题和类别标签
- 描述文本
- 功能标签
- 悬停动画和3D效果

### 响应式设计
- 网格布局：1列（移动端）→ 2列（平板）→ 3列（桌面）
- 卡片间距：`gap-6` 以优化移动端浏览
- 卡片尺寸为内容密度优化

### 动画系统
- CSS过渡效果用于悬停效果
- 卡片3D变换效果
- 行动号召元素的浮动动画
- 通过JavaScript实现点击反馈动画

## 内容管理

### 添加新项目
1. 从 `index.html` 复制现有卡片结构
2. 更新以下元素：
   - `href` 属性中的项目URL
   - 头部div中的渐变颜色
   - Font Awesome图标类
   - 项目标题和类别
   - 描述文本
   - 功能标签

### 配色方案模式
每个项目使用独特的渐变组合：
- 格式：`from-{color}-100 to-{color}-100`
- 类别使用一致的色彩系列（例如AI项目使用蓝色变体）

## 浏览器兼容性

- 支持CSS Grid和Flexbox的现代浏览器
- CDN依赖项 (Tailwind CSS, Font Awesome)
- 无需构建过程

## 性能考虑

- 外部CDN资源 (Tailwind CSS, Font Awesome)
- 最小的JavaScript占用
- 使用图标和渐变的优化无图片设计
- 单HTML文件实现快速加载