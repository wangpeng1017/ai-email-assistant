# Vercel环境变量配置指南

## 🔧 **必需的环境变量**

### **1. Supabase配置 (已配置)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **2. Gemini AI配置 (已配置)**
```bash
GEMINI_API_KEY=your-gemini-api-key
```

### **3. Gmail API配置 (❌ 缺失 - 必需)**
```bash
# Google Cloud Console OAuth2客户端配置
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/auth/callback

# 或者使用生产域名
GOOGLE_REDIRECT_URI=https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
```

### **4. 站点URL配置 (❌ 缺失 - 推荐)**
```bash
# 用于OAuth重定向和邮件链接
NEXT_PUBLIC_SITE_URL=https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
```

### **5. 安全配置 (❌ 缺失 - 推荐)**
```bash
# JWT密钥用于会话管理
NEXTAUTH_SECRET=your-random-secret-key-32-characters-long
NEXTAUTH_URL=https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
```

## 🚀 **Vercel配置步骤**

### **步骤1: 访问Vercel项目设置**
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `ai-email-assistant`
3. 进入 `Settings` → `Environment Variables`

### **步骤2: 添加Gmail API变量**
```bash
# 变量名: GOOGLE_CLIENT_ID
# 值: 从Google Cloud Console获取
# 环境: Production, Preview, Development

# 变量名: GOOGLE_CLIENT_SECRET  
# 值: 从Google Cloud Console获取
# 环境: Production, Preview, Development

# 变量名: GOOGLE_REDIRECT_URI
# 值: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
# 环境: Production, Preview, Development
```

### **步骤3: 添加站点URL变量**
```bash
# 变量名: NEXT_PUBLIC_SITE_URL
# 值: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
# 环境: Production, Preview, Development
```

### **步骤4: 添加安全变量**
```bash
# 变量名: NEXTAUTH_SECRET
# 值: 生成32字符随机字符串
# 环境: Production, Preview, Development

# 变量名: NEXTAUTH_URL
# 值: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
# 环境: Production, Preview, Development
```

## 🔑 **Google Cloud Console配置**

### **获取Gmail API凭据**
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用Gmail API：
   - 进入 `APIs & Services` → `Library`
   - 搜索 "Gmail API" 并启用

4. 创建OAuth2凭据：
   - 进入 `APIs & Services` → `Credentials`
   - 点击 `Create Credentials` → `OAuth client ID`
   - 选择 `Web application`
   - 添加授权重定向URI：
     ```
     https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
     https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback
     ```

5. 配置OAuth同意屏幕：
   - 进入 `APIs & Services` → `OAuth consent screen`
   - 填写应用信息
   - 添加授权域名：`vercel.app`
   - 添加范围：
     ```
     https://www.googleapis.com/auth/gmail.compose
     https://www.googleapis.com/auth/gmail.modify
     https://mail.google.com/
     ```

## 🔒 **安全最佳实践**

### **生成安全密钥**
```bash
# 生成NEXTAUTH_SECRET (在本地终端运行)
openssl rand -base64 32

# 或使用在线生成器
# https://generate-secret.vercel.app/32
```

### **域名配置**
确保所有重定向URI使用HTTPS并匹配实际部署域名：
- ✅ `https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app`
- ❌ `http://localhost:3000` (仅开发环境)

## 📊 **环境变量检查清单**

| 变量名 | 状态 | 用途 | 优先级 |
|--------|------|------|--------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ 已配置 | 数据库连接 | 必需 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ 已配置 | 数据库认证 | 必需 |
| SUPABASE_SERVICE_ROLE_KEY | ✅ 已配置 | 服务端操作 | 必需 |
| GEMINI_API_KEY | ✅ 已配置 | AI内容生成 | 必需 |
| GOOGLE_CLIENT_ID | ❌ 缺失 | Gmail OAuth | 必需 |
| GOOGLE_CLIENT_SECRET | ❌ 缺失 | Gmail OAuth | 必需 |
| GOOGLE_REDIRECT_URI | ❌ 缺失 | Gmail OAuth | 必需 |
| NEXT_PUBLIC_SITE_URL | ❌ 缺失 | 站点配置 | 推荐 |
| NEXTAUTH_SECRET | ❌ 缺失 | 会话安全 | 推荐 |
| NEXTAUTH_URL | ❌ 缺失 | 认证配置 | 推荐 |

## 🚨 **部署后验证**

### **检查环境变量加载**
1. 部署完成后访问应用
2. 打开浏览器开发者工具
3. 检查控制台是否有环境变量相关错误
4. 测试Gmail集成功能

### **功能测试清单**
- [ ] 用户登录/注册
- [ ] 客户线索添加
- [ ] AI邮件生成
- [ ] Gmail OAuth连接
- [ ] 邮件草稿创建
- [ ] 智能附件推荐

## 📞 **故障排除**

### **常见问题**
1. **Gmail OAuth失败**
   - 检查GOOGLE_CLIENT_ID和GOOGLE_CLIENT_SECRET
   - 验证重定向URI配置
   - 确认Gmail API已启用

2. **站点URL错误**
   - 检查NEXT_PUBLIC_SITE_URL设置
   - 确保使用HTTPS协议
   - 验证域名拼写正确

3. **会话问题**
   - 检查NEXTAUTH_SECRET配置
   - 确保密钥长度足够（32字符）
   - 验证NEXTAUTH_URL设置

---
**更新时间**: 2025-01-22
**版本**: 1.0
**状态**: 等待Gmail API配置
