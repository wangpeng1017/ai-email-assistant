# AI邮件自动化助手 - 完整设置和部署指南

## 项目概述

AI邮件自动化助手是一个基于Next.js的Web应用，集成了Supabase数据库、Google Gemini AI和现代化的用户界面。本指南将帮助您从零开始部署这个应用。

## 技术栈

- **前端框架**: Next.js 15 + TypeScript + Tailwind CSS
- **数据库**: Supabase (PostgreSQL + Auth + Storage)
- **AI服务**: Google Gemini 1.0 Pro API
- **部署平台**: Vercel
- **代码管理**: GitHub

## 第一步：准备工作

### 1.1 系统要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- Git 版本控制
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 1.2 账户准备
确保您拥有以下服务的账户：
- [GitHub](https://github.com) - 代码托管
- [Supabase](https://supabase.com) - 数据库和认证
- [Google AI Studio](https://aistudio.google.com) - AI服务
- [Vercel](https://vercel.com) - 部署平台

## 第二步：Supabase 数据库设置

### 2.1 创建Supabase项目
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project" 创建新项目
3. 选择组织，输入项目名称（如：ai-email-assistant）
4. 选择数据库密码（请记住此密码）
5. 选择地区（建议选择离您最近的地区）
6. 点击 "Create new project"

### 2.2 获取项目配置信息
项目创建完成后，在项目设置页面获取：
- **Project URL**: `https://your-project-id.supabase.co`
- **API Keys**:
  - `anon` key (公开密钥)
  - `service_role` key (服务端密钥，请妥善保管)

### 2.3 配置数据库
1. 在Supabase Dashboard中，点击左侧菜单的 "SQL Editor"
2. 点击 "New query" 创建新查询
3. 复制 `supabase/migrations/001_initial_schema.sql` 文件中的所有SQL代码
4. 粘贴到查询编辑器中
5. 点击 "Run" 执行SQL脚本

这将创建以下数据库结构：
- `leads` 表：存储客户线索信息
- `product_materials` 表：存储产品资料信息
- 相关的索引和安全策略

### 2.4 验证数据库设置
1. 在左侧菜单点击 "Table Editor"
2. 确认可以看到 `leads` 和 `product_materials` 两个表
3. 点击 "Authentication" 确认用户认证功能已启用

## 第三步：Google AI (Gemini) 设置

### 3.1 获取Gemini API密钥
1. 访问 [Google AI Studio](https://aistudio.google.com)
2. 使用Google账户登录
3. 点击 "Get API key" 或 "Create API key"
4. 选择 "Create API key in new project" 或使用现有项目
5. 复制生成的API密钥（格式类似：`AIzaSyC...`）

### 3.2 测试API密钥
您可以使用以下curl命令测试API密钥是否有效：

```bash
curl -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=YOUR_API_KEY'
```

## 第四步：本地开发环境设置

### 4.1 克隆项目代码
```bash
# 克隆仓库（替换为您的仓库地址）
git clone https://github.com/your-username/ai-email-assistant.git
cd ai-email-assistant
```

### 4.2 安装依赖
```bash
npm install
```

### 4.3 配置环境变量
1. 复制环境变量模板：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，填入实际值：
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### 4.4 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 4.5 测试基本功能
1. 注册新用户账户
2. 登录系统
3. 添加一个测试客户线索
4. 启动自动化处理
5. 查看生成的邮件内容

## 第五步：部署到Vercel

### 5.1 准备GitHub仓库
1. 在GitHub上创建新仓库
2. 将本地代码推送到GitHub：
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/ai-email-assistant.git
git push -u origin main
```

### 5.2 连接Vercel
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 "Import Git Repository"
4. 选择您的GitHub仓库
5. 点击 "Import"

### 5.3 配置环境变量
在Vercel项目设置中：
1. 点击 "Settings" 标签
2. 点击左侧菜单的 "Environment Variables"
3. 添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key
GEMINI_API_KEY = your_gemini_api_key
```

### 5.4 部署应用
1. 点击 "Deploy" 开始部署
2. 等待部署完成（通常需要2-5分钟）
3. 部署成功后，您将获得一个生产环境URL（如：`https://your-app.vercel.app`）

### 5.5 验证部署
1. 访问生产环境URL
2. 测试用户注册和登录功能
3. 测试添加客户线索功能
4. 测试AI内容生成功能

## 第六步：生产环境优化

### 6.1 域名配置（可选）
如果您有自定义域名：
1. 在Vercel项目设置中点击 "Domains"
2. 添加您的域名
3. 按照提示配置DNS记录

### 6.2 监控和日志
1. 在Vercel Dashboard中查看 "Functions" 标签监控API性能
2. 查看 "Analytics" 了解用户使用情况
3. 在Supabase Dashboard中监控数据库性能

### 6.3 安全设置
1. 在Supabase项目设置中配置 "Site URL" 为您的生产域名
2. 在 "Auth" 设置中配置允许的重定向URL
3. 定期更新依赖包：`npm audit` 和 `npm update`

## 故障排除

### 常见问题

**1. 数据库连接失败**
- 检查Supabase URL和API密钥是否正确
- 确认数据库迁移脚本已正确执行
- 检查网络连接

**2. AI内容生成失败**
- 验证Gemini API密钥是否有效
- 检查API配额是否已用完
- 确认网络可以访问Google AI服务

**3. 部署失败**
- 检查所有环境变量是否已正确配置
- 确认代码中没有语法错误
- 查看Vercel部署日志获取详细错误信息

**4. 用户认证问题**
- 检查Supabase Auth配置
- 确认Site URL设置正确
- 验证重定向URL配置

### 获取帮助

如果遇到问题，可以：
1. 查看浏览器开发者工具的控制台错误
2. 检查Vercel和Supabase的日志
3. 参考官方文档：
   - [Next.js文档](https://nextjs.org/docs)
   - [Supabase文档](https://supabase.com/docs)
   - [Vercel文档](https://vercel.com/docs)

## 后续开发

### 功能扩展
当前版本是MVP，后续可以添加：
- Gmail API集成（自动创建邮件草稿）
- Excel文件批量导入
- 网页爬取功能
- 产品资料文件上传
- 邮件模板管理
- 数据分析和报表

### 代码维护
- 定期更新依赖包
- 监控应用性能
- 备份数据库
- 实施CI/CD流程

恭喜！您已成功部署AI邮件自动化助手。开始使用这个强大的工具来提升您的邮件营销效率吧！
