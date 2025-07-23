# Vercel部署完整指南

## 🚀 **立即配置 - Gmail API环境变量**

### **第1步: 访问Vercel Dashboard**
1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `ai-email-assistant`
3. 点击 `Settings` → `Environment Variables`

### **第2步: 添加Gmail API环境变量**

**复制粘贴以下配置:**

#### **变量1: GOOGLE_CLIENT_ID**
```
Name: GOOGLE_CLIENT_ID
Value: [从用户提供的凭据中获取]
Environment: ✅ Production ✅ Preview ✅ Development
```

#### **变量2: GOOGLE_CLIENT_SECRET**
```
Name: GOOGLE_CLIENT_SECRET
Value: [从用户提供的凭据中获取]
Environment: ✅ Production ✅ Preview ✅ Development
```

#### **变量3: GOOGLE_REDIRECT_URI**
```
Name: GOOGLE_REDIRECT_URI
Value: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
Environment: ✅ Production ✅ Preview ✅ Development
```

### **第3步: 可选的增强配置**

#### **站点URL配置 (推荐)**
```
Name: NEXT_PUBLIC_SITE_URL
Value: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
Environment: ✅ Production ✅ Preview ✅ Development
```

#### **NextAuth安全配置 (可选)**
```
Name: NEXTAUTH_SECRET
Value: [生成32字符随机字符串]
Environment: ✅ Production ✅ Preview ✅ Development

Name: NEXTAUTH_URL
Value: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
Environment: ✅ Production ✅ Preview ✅ Development
```

## 🔧 **当前环境变量状态**

| 变量名 | 状态 | 值 |
|--------|------|-----|
| NEXT_PUBLIC_SUPABASE_URL | ✅ 已配置 | https://ulrvltozsppbskksycmg.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ 已配置 | eyJ... |
| SUPABASE_SERVICE_ROLE_KEY | ✅ 已配置 | eyJ... |
| GEMINI_API_KEY | ✅ 已配置 | AIza... |
| **GOOGLE_CLIENT_ID** | ⚠️ **需要添加** | [用户提供的Client ID] |
| **GOOGLE_CLIENT_SECRET** | ⚠️ **需要添加** | [用户提供的Client Secret] |
| **GOOGLE_REDIRECT_URI** | ⚠️ **需要添加** | https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback |

## 📋 **部署检查清单**

### **✅ 已完成**
- [x] Suspense边界错误修复
- [x] TypeScript编译错误修复
- [x] ESLint警告清理
- [x] Gmail API凭据获取
- [x] 环境变量验证脚本

### **⚠️ 待完成**
- [ ] 在Vercel中添加Gmail API环境变量
- [ ] 触发新的部署
- [ ] 测试Gmail OAuth功能

## 🔒 **Google Cloud Console配置验证**

### **必需的配置项**
1. **Gmail API启用** ✅
   - 项目ID: 547683401586
   - API: Gmail API v1

2. **OAuth2客户端配置** ✅
   - 类型: Web应用程序
   - 客户端ID: [用户提供的Client ID]

3. **授权重定向URI** ⚠️ 需要验证
   ```
   https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
   https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback
   ```

4. **OAuth同意屏幕** ⚠️ 需要配置
   - 应用名称: AI邮件自动化助手
   - 用户类型: 外部
   - 授权域名: vercel.app
   - 范围:
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://mail.google.com/`

## 🚀 **部署流程**

### **自动部署 (推荐)**
1. 在Vercel中添加环境变量
2. 代码已推送到GitHub，将自动触发部署
3. 等待部署完成 (~2-3分钟)

### **手动部署**
1. 在Vercel Dashboard中点击 `Deployments`
2. 点击 `Redeploy` 按钮
3. 选择最新的commit进行部署

## 🧪 **部署后测试**

### **基础功能测试**
1. **访问应用**: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
2. **用户注册/登录**: 测试Supabase认证
3. **添加客户线索**: 测试基础功能
4. **AI邮件生成**: 测试Gemini AI集成

### **Gmail集成测试**
1. **Gmail连接**: 点击"连接Gmail"按钮
2. **OAuth授权**: 完成Google OAuth流程
3. **邮件草稿创建**: 测试Gmail草稿功能
4. **附件推荐**: 测试智能附件匹配

## 📞 **故障排除**

### **常见问题**

#### **1. OAuth错误: redirect_uri_mismatch**
**解决方案**: 检查Google Cloud Console中的重定向URI配置
```
正确的URI: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
```

#### **2. Gmail API未启用错误**
**解决方案**: 在Google Cloud Console中启用Gmail API
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择项目 (ID: 547683401586)
3. APIs & Services → Library
4. 搜索"Gmail API"并启用

#### **3. 环境变量未生效**
**解决方案**: 
1. 确认环境变量已在Vercel中正确配置
2. 触发新的部署
3. 检查部署日志中的环境变量加载情况

#### **4. OAuth同意屏幕错误**
**解决方案**: 配置OAuth同意屏幕
1. Google Cloud Console → APIs & Services → OAuth consent screen
2. 填写应用信息
3. 添加授权域名: `vercel.app`
4. 配置所需的OAuth范围

## 📊 **部署成功指标**

### **技术指标**
- ✅ 构建时间 < 3分钟
- ✅ 部署状态: Ready
- ✅ 函数冷启动 < 2秒
- ✅ 页面加载时间 < 3秒

### **功能指标**
- ✅ 用户认证正常
- ✅ 数据库连接正常
- ✅ AI内容生成正常
- ✅ Gmail OAuth正常
- ✅ 邮件草稿创建正常

---

**配置完成后，您的AI邮件自动化助手将具备完整的Gmail集成功能！** 🎉
