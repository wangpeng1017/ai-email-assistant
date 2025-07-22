# AI邮件自动化助手 - 部署检查清单

## 📋 部署前检查清单

### ✅ 开发环境准备
- [ ] Node.js 18.0+ 已安装
- [ ] Git 已安装并配置
- [ ] 代码已推送到GitHub仓库
- [ ] 所有依赖已正确安装 (`npm install`)

### ✅ 服务账户设置
- [ ] Supabase账户已创建
- [ ] Google AI Studio账户已创建  
- [ ] Vercel账户已创建
- [ ] GitHub账户已连接到Vercel

### ✅ Supabase配置
- [ ] 新项目已创建
- [ ] 项目URL已记录
- [ ] API密钥已获取（anon key 和 service_role key）
- [ ] 数据库迁移脚本已执行
- [ ] 表结构已验证（leads, product_materials）
- [ ] RLS策略已启用
- [ ] Auth设置已配置

### ✅ Google AI配置
- [ ] Google AI Studio项目已创建
- [ ] Gemini API密钥已获取
- [ ] API配额已确认
- [ ] API密钥已测试

### ✅ 环境变量配置
- [ ] `.env.local` 文件已创建
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已设置
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已设置
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已设置
- [ ] `GEMINI_API_KEY` 已设置
- [ ] 所有环境变量值已验证

### ✅ 本地测试
- [ ] 开发服务器可以启动 (`npm run dev`)
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 添加客户线索功能正常
- [ ] AI内容生成功能正常
- [ ] 邮件预览功能正常
- [ ] 错误处理正常显示

### ✅ 代码质量检查
- [ ] ESLint检查通过 (`npm run lint`)
- [ ] TypeScript类型检查通过 (`npm run type-check`)
- [ ] 构建成功 (`npm run build`)
- [ ] 生产模式启动正常 (`npm start`)

### ✅ Vercel部署配置
- [ ] GitHub仓库已连接
- [ ] 项目已导入到Vercel
- [ ] 环境变量已在Vercel中配置
- [ ] 构建设置已确认
- [ ] 域名设置已配置（如需要）

### ✅ 生产环境验证
- [ ] 部署成功完成
- [ ] 生产URL可以访问
- [ ] 用户注册/登录功能正常
- [ ] 数据库连接正常
- [ ] AI服务连接正常
- [ ] 所有核心功能正常工作
- [ ] 错误处理正常
- [ ] 性能表现良好

## 🚀 快速部署命令

### 1. 环境设置
```bash
# 克隆项目
git clone <your-repo-url>
cd ai-email-assistant

# 安装依赖
npm install

# 运行设置向导
npm run setup

# 启动开发服务器测试
npm run dev
```

### 2. 数据库设置
```sql
-- 在Supabase SQL Editor中执行
-- 复制 supabase/migrations/001_initial_schema.sql 内容
```

### 3. 部署到Vercel
```bash
# 推送代码到GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 在Vercel Dashboard中：
# 1. Import Git Repository
# 2. 配置环境变量
# 3. Deploy
```

## ⚠️ 常见问题解决

### 构建失败
- 检查所有环境变量是否正确设置
- 确认依赖包版本兼容性
- 查看构建日志获取详细错误信息

### 数据库连接失败
- 验证Supabase URL和API密钥
- 检查网络连接
- 确认数据库迁移已执行

### AI服务不可用
- 验证Gemini API密钥
- 检查API配额使用情况
- 确认网络可以访问Google AI服务

### 认证问题
- 检查Supabase Auth配置
- 确认Site URL设置正确
- 验证重定向URL配置

## 📞 获取帮助

如果遇到问题：
1. 查看项目文档（README.md, SETUP.md）
2. 检查浏览器开发者工具控制台
3. 查看Vercel和Supabase的日志
4. 参考官方文档

## 🎉 部署成功！

完成所有检查项后，您的AI邮件自动化助手就可以正式投入使用了！

**记住定期备份数据库和更新依赖包以确保系统安全和稳定运行。**
