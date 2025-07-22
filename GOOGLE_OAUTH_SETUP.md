# Google OAuth 配置指南

## 1. Google Cloud Console 配置

### 步骤1：创建Google Cloud项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 记录项目ID

### 步骤2：启用Google+ API
1. 在Google Cloud Console中，导航到 "APIs & Services" > "Library"
2. 搜索 "Google+ API" 并启用它
3. 或者启用 "Google Identity" API

### 步骤3：创建OAuth 2.0凭据
1. 导航到 "APIs & Services" > "Credentials"
2. 点击 "Create Credentials" > "OAuth 2.0 Client IDs"
3. 选择应用类型为 "Web application"
4. 配置授权重定向URI：
   - 开发环境：`https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback`
   - 生产环境：`https://your-project.supabase.co/auth/v1/callback`
5. 记录 Client ID 和 Client Secret

## 2. Supabase 配置

### 步骤1：配置Google Provider
1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择您的项目：ulrvltozsppbskksycmg
3. 导航到 Authentication > Providers
4. 找到 Google 并点击配置
5. 启用 Google provider
6. 输入从Google Cloud Console获取的：
   - Client ID
   - Client Secret
7. 保存配置

### 步骤2：配置重定向URL
1. 在 Authentication > URL Configuration 中
2. 添加允许的重定向URL：
   - `http://localhost:3000/dashboard` (开发环境)
   - `https://your-domain.com/dashboard` (生产环境)

## 3. 环境变量配置

在 `.env.local` 文件中添加（如果需要）：
```
# Google OAuth (通常不需要，Supabase会处理)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 4. 测试配置

### 开发环境测试
1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:3000
3. 点击 "使用 Google 账号登录"
4. 验证重定向到Google登录页面
5. 完成登录后验证重定向到仪表板

### 常见问题排查

#### 错误：redirect_uri_mismatch
- 检查Google Cloud Console中的重定向URI配置
- 确保URI完全匹配（包括协议、域名、端口）

#### 错误：access_denied
- 检查Google Cloud Console中的OAuth同意屏幕配置
- 确保应用状态为"已发布"或添加测试用户

#### 错误：invalid_client
- 检查Supabase中的Client ID和Client Secret
- 确保凭据来自正确的Google Cloud项目

## 5. 安全注意事项

1. **Client Secret安全**：
   - 永远不要在客户端代码中暴露Client Secret
   - Supabase会在服务器端处理OAuth流程

2. **重定向URI验证**：
   - 只添加必要的重定向URI
   - 使用HTTPS（生产环境）

3. **作用域限制**：
   - 只请求必要的权限
   - 默认情况下只获取基本用户信息

## 6. 生产环境部署

部署到生产环境时：
1. 更新Google Cloud Console中的重定向URI
2. 更新Supabase中的允许重定向URL
3. 确保使用HTTPS
4. 测试完整的OAuth流程
