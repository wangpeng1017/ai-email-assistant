# Gmail API配置指南

## 🔐 **重要安全提醒**

**用户已提供Gmail API凭据，请按照以下步骤在Vercel中配置:**

## 📋 **Vercel环境变量配置**

### **第1步: 访问Vercel Dashboard**
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `ai-email-assistant`
3. 进入 `Settings` → `Environment Variables`

### **第2步: 添加Gmail API环境变量**

请添加以下3个环境变量（使用用户提供的实际值）:

#### **GOOGLE_CLIENT_ID**
```
Name: GOOGLE_CLIENT_ID
Value: [用户提供的Client ID - 以.apps.googleusercontent.com结尾]
Environment: ✅ Production ✅ Preview ✅ Development
```

#### **GOOGLE_CLIENT_SECRET**
```
Name: GOOGLE_CLIENT_SECRET  
Value: [用户提供的Client Secret - 以GOCSPX-开头]
Environment: ✅ Production ✅ Preview ✅ Development
```

#### **GOOGLE_REDIRECT_URI**
```
Name: GOOGLE_REDIRECT_URI
Value: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
Environment: ✅ Production ✅ Preview ✅ Development
```

## 🔧 **Google Cloud Console验证**

### **必需的配置检查**

1. **Gmail API已启用** ✅
   - 访问: https://console.cloud.google.com/
   - APIs & Services → Library
   - 确认"Gmail API"已启用

2. **OAuth2客户端配置** ✅
   - APIs & Services → Credentials
   - 确认Web应用程序类型的OAuth客户端已创建

3. **授权重定向URI配置** ⚠️ **重要**
   
   确保在Google Cloud Console中配置了以下重定向URI:
   ```
   https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
   https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback
   ```

4. **OAuth同意屏幕配置** ⚠️ **必需**
   - 应用名称: AI邮件自动化助手
   - 用户类型: 外部
   - 授权域名: `vercel.app`
   - 必需的OAuth范围:
     ```
     https://www.googleapis.com/auth/gmail.compose
     https://www.googleapis.com/auth/gmail.modify  
     https://mail.google.com/
     ```

## 🚀 **部署流程**

### **配置完成后**
1. 在Vercel中添加上述3个环境变量
2. 代码将自动重新部署
3. 等待部署完成（约2-3分钟）

### **验证部署**
1. 访问应用: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
2. 测试Gmail连接功能
3. 验证OAuth授权流程

## 🧪 **功能测试清单**

### **基础功能**
- [ ] 用户注册/登录
- [ ] 添加客户线索
- [ ] AI邮件内容生成

### **Gmail集成**
- [ ] 点击"连接Gmail"按钮
- [ ] 完成Google OAuth授权
- [ ] 创建Gmail草稿
- [ ] 智能附件推荐

## 📞 **故障排除**

### **常见OAuth错误**

#### **redirect_uri_mismatch**
**原因**: 重定向URI不匹配
**解决**: 检查Google Cloud Console中的重定向URI配置

#### **access_denied**
**原因**: OAuth同意屏幕配置问题
**解决**: 确认OAuth同意屏幕已正确配置并发布

#### **invalid_client**
**原因**: Client ID或Secret错误
**解决**: 检查Vercel中的环境变量配置

## 🔒 **安全最佳实践**

1. **环境变量安全**
   - 仅在Vercel Dashboard中配置敏感信息
   - 不要在代码中硬编码API密钥
   - 定期轮换OAuth凭据

2. **OAuth范围限制**
   - 仅请求必需的Gmail权限
   - 定期审查OAuth范围

3. **域名验证**
   - 确保重定向URI使用HTTPS
   - 验证授权域名配置

---

**配置完成后，您的AI邮件助手将具备完整的Gmail集成功能！** 🎉

**注意**: 所有敏感信息应仅在Vercel Dashboard中配置，不要提交到代码仓库。
