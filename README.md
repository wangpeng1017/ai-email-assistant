# AI邮件自动化助手

一个智能的邮件营销自动化工具，帮助销售和市场人员快速生成个性化的商务邮件。

## 🚀 功能特点

- **智能网页分析**: 自动分析客户官网，提取业务信息
- **AI内容生成**: 基于Google Gemini AI生成个性化邮件内容
- **用户友好界面**: 简洁直观的操作界面
- **实时状态跟踪**: 实时显示处理进度和结果
- **安全认证**: 基于Supabase的安全用户认证系统

## 🛠️ 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **数据库**: Supabase (PostgreSQL + Auth)
- **AI服务**: Google Gemini 1.0 Pro API
- **部署**: Vercel
- **开发工具**: VS Code + Augment扩展

## 📋 系统要求

- Node.js 18.0+
- npm 或 yarn
- 现代浏览器

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai-email-assistant.git
cd ai-email-assistant
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板并填入实际值：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### 4. 设置数据库

在Supabase SQL编辑器中执行 `supabase/migrations/001_initial_schema.sql` 文件中的SQL脚本。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 开始使用。

## 📖 详细设置指南

请查看 [SETUP.md](./SETUP.md) 获取完整的设置和部署指南，包括：

- Supabase数据库配置
- Google AI API设置
- 本地开发环境配置
- Vercel部署步骤
- 故障排除指南

## 🎯 使用方法

### 1. 用户注册/登录
- 访问应用首页
- 使用邮箱注册新账户或登录现有账户

### 2. 添加客户线索
- 在仪表板点击"手动输入"
- 填写客户官网地址、联系人姓名和邮箱
- 提交表单

### 3. 生成邮件内容
- 点击"启动自动化处理"按钮
- 系统将自动分析客户网站并生成个性化邮件
- 在线索列表中查看处理状态

### 4. 查看结果
- 处理完成后，点击"查看邮件"按钮
- 预览生成的邮件标题和内容
- 复制内容到您的邮件客户端

## 🏗️ 项目结构

```
ai-email-assistant/
├── src/
│   ├── app/                 # Next.js App Router页面
│   ├── components/          # React组件
│   ├── contexts/           # React上下文
│   ├── lib/                # 工具函数和配置
│   └── types/              # TypeScript类型定义
├── supabase/
│   └── migrations/         # 数据库迁移脚本
├── public/                 # 静态资源
└── docs/                   # 文档
```

## 🔧 开发

### 可用脚本

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

### 代码规范

- 使用TypeScript进行类型安全
- 遵循ESLint规则
- 使用Prettier格式化代码
- 组件使用函数式组件和Hooks

## 🚀 部署

### Vercel部署（推荐）

1. 将代码推送到GitHub
2. 在Vercel中导入仓库
3. 配置环境变量
4. 自动部署

详细步骤请参考 [SETUP.md](./SETUP.md)。

## 🔒 安全性

- 所有API密钥通过环境变量管理
- 使用Supabase Row Level Security (RLS)
- 用户数据隔离和权限控制
- HTTPS加密传输

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**: 检查Supabase配置和网络连接
2. **AI生成失败**: 验证Gemini API密钥和配额
3. **部署错误**: 检查环境变量和构建日志

更多问题请查看 [SETUP.md](./SETUP.md) 中的故障排除部分。

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [SETUP.md](./SETUP.md) 文档
2. 搜索现有的 [Issues](https://github.com/your-username/ai-email-assistant/issues)
3. 创建新的 Issue 描述问题

## 🎉 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Supabase](https://supabase.com/) - 后端即服务
- [Google AI](https://ai.google.dev/) - AI服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Vercel](https://vercel.com/) - 部署平台

---

**开始使用AI邮件自动化助手，提升您的邮件营销效率！** 🚀
