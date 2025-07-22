# AI邮件自动化助手 - Vercel部署指导

## 🚀 完整部署流程

### 步骤1: 部署前准备

#### 1.1 检查项目构建
```bash
# 增加内存限制后重新构建
npm run build
```

#### 1.2 验证环境变量
确认以下环境变量已正确配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

#### 1.3 Git仓库准备
```bash
# 确保所有更改已提交
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 步骤2: Vercel部署配置

#### 2.1 创建Vercel项目
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 连接GitHub仓库
4. 选择 `ai-email-assistant` 项目

#### 2.2 配置环境变量
在Vercel项目设置中添加：

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://ulrvltozsppbskksycmg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyBtw7WLw0Lf749k0j5yeKJpjz1AfWgDsuA
NODE_OPTIONS=--max-old-space-size=4096
```

#### 2.3 构建设置
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 步骤3: Google OAuth生产环境配置

#### 3.1 获取Vercel域名
部署完成后，获取Vercel分配的域名（例如：`your-app.vercel.app`）

#### 3.2 更新Google Cloud Console
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 导航到 APIs & Services > Credentials
3. 编辑OAuth 2.0客户端ID
4. 在"授权重定向URI"中添加：
   ```
   https://your-app.vercel.app
   https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback
   ```

#### 3.3 更新Supabase配置
1. 访问 [Supabase Dashboard](https://app.supabase.com/project/ulrvltozsppbskksycmg)
2. 导航到 Authentication > URL Configuration
3. 在"Redirect URLs"中添加：
   ```
   https://your-app.vercel.app/dashboard
   http://localhost:3000/dashboard
   ```

### 步骤4: 数据库迁移验证

#### 4.1 检查迁移状态
```bash
npm run verify-db
```

#### 4.2 确认RLS策略
验证以下策略已启用：
- `leads` 表的用户隔离策略
- `product_materials` 表的访问控制
- `auth.users` 表的读取权限

### 步骤5: 部署后验证

#### 5.1 功能测试清单
- [ ] 应用正常加载
- [ ] Google OAuth登录功能
- [ ] 仪表板访问权限
- [ ] 数据库连接
- [ ] API端点响应

#### 5.2 测试脚本
```bash
# 本地测试生产构建
npm run build
npm run start

# 访问 http://localhost:3000 测试
```

## 🔧 常见问题解决

### 构建内存不足
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### OAuth重定向错误
1. 检查Google Cloud Console中的重定向URI
2. 确认Supabase中的重定向URL配置
3. 验证域名拼写正确

### 环境变量问题
1. 确认所有环境变量已在Vercel中设置
2. 检查变量名拼写
3. 重新部署项目

## 📋 部署检查清单

### 部署前
- [ ] 项目构建成功
- [ ] 所有TypeScript错误已修复
- [ ] 环境变量已配置
- [ ] Git仓库已更新

### Vercel配置
- [ ] 项目已连接到GitHub
- [ ] 环境变量已设置
- [ ] 构建设置正确
- [ ] 域名已获取

### OAuth配置
- [ ] Google Cloud Console已更新
- [ ] Supabase重定向URL已配置
- [ ] 测试OAuth流程

### 验证测试
- [ ] 生产环境可访问
- [ ] Google登录功能正常
- [ ] 数据库连接正常
- [ ] 所有功能正常工作

## 🎯 部署完成后的URL

- **生产环境**: https://your-app.vercel.app
- **Supabase项目**: https://app.supabase.com/project/ulrvltozsppbskksycmg
- **Google Cloud Console**: https://console.cloud.google.com/

## 📞 技术支持

如遇到部署问题，请检查：
1. Vercel部署日志
2. 浏览器开发者工具控制台
3. Supabase项目日志
4. Google Cloud Console配置
