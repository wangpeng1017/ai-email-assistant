# Google OAuth重定向问题修复指导

## 🚨 问题描述
Google OAuth登录后重定向到 `localhost:3000` 而不是生产环境URL。

## ✅ 已实施的代码修复

### 1. AuthContext重定向逻辑优化
- ✅ 添加了环境变量优先级检查
- ✅ 强制localhost重定向到生产环境
- ✅ 增加了详细的调试日志
- ✅ 添加了多层级的URL获取逻辑

### 2. 环境变量配置
- ✅ 添加了 `NEXT_PUBLIC_SITE_URL` 环境变量
- ✅ 设置生产环境URL为默认值

## 🔧 必须完成的配置步骤

### 步骤1: Google Cloud Console配置

1. **访问Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **找到您的OAuth 2.0客户端ID**
   - 选择正确的项目
   - 点击"凭据"
   - 找到OAuth 2.0客户端ID

3. **添加授权重定向URI**
   在"授权重定向URI"部分添加：
   ```
   https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
   https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback
   ```

4. **保存配置**

### 步骤2: Supabase Dashboard配置

1. **访问Supabase Auth设置**
   ```
   https://supabase.com/dashboard/project/ulrvltozsppbskksycmg/auth/settings
   ```

2. **配置Site URL**
   ```
   Site URL: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
   ```

3. **配置Redirect URLs**
   ```
   https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/dashboard
   ```

4. **保存配置**

### 步骤3: Vercel环境变量配置

1. **访问Vercel项目设置**
   ```
   https://vercel.com/dashboard
   ```

2. **进入项目设置**
   - 找到 `ai-email-assistant` 项目
   - 点击 Settings → Environment Variables

3. **添加环境变量**
   ```
   名称: NEXT_PUBLIC_SITE_URL
   值: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
   环境: Production, Preview, Development
   ```

4. **保存配置**

## 🚀 部署和测试

### 部署更新
```bash
git add .
git commit -m "Fix Google OAuth redirect configuration"
git push origin master
```

### 测试步骤

1. **等待部署完成**
   - 在Vercel Dashboard中确认部署状态为"Ready"

2. **访问生产环境**
   ```
   https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/
   ```

3. **测试Google OAuth**
   - 点击"使用Google账号登录"
   - 完成Google认证
   - **验证重定向**: 应该重定向到生产环境的 `/dashboard` 页面

4. **使用测试账号**
   - 邮箱: `test@ai-email-assistant.com`
   - 密码: `TestUser123!`

## 🔍 调试方法

### 浏览器调试
1. **打开开发者工具** (F12)
2. **查看Console日志**
   - 应该看到: `✅ 最终OAuth重定向URL: https://...`
3. **检查Network标签**
   - 查看OAuth请求的重定向参数

### 预期的日志输出
```
🌐 使用环境变量站点URL: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
✅ 最终OAuth重定向URL: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/dashboard
```

## 🚨 常见问题排除

### 问题1: 仍然重定向到localhost
**原因**: Google Cloud Console或Supabase配置未更新
**解决**: 重新检查步骤1和步骤2的配置

### 问题2: 重定向URI不匹配错误
**原因**: Google Cloud Console中的重定向URI不完整
**解决**: 确保添加了两个重定向URI

### 问题3: 环境变量未生效
**原因**: Vercel环境变量配置错误或未重新部署
**解决**: 重新配置环境变量并重新部署

### 问题4: 认证成功但页面空白
**原因**: `/dashboard` 路由问题
**解决**: 检查dashboard页面是否正常工作

## ✅ 验证清单

- [ ] Google Cloud Console重定向URI已添加
- [ ] Supabase Site URL已设置
- [ ] Supabase Redirect URLs已配置
- [ ] Vercel环境变量已添加
- [ ] 代码已部署到生产环境
- [ ] OAuth重定向到正确的生产URL
- [ ] 测试账号可以正常登录
- [ ] Dashboard页面正常显示

## 📞 技术支持

如果问题仍然存在，请提供：
1. 浏览器Console日志截图
2. Network标签中的OAuth请求详情
3. 具体的错误信息
4. 配置截图（隐藏敏感信息）

---
**修复时间**: 2025-01-22
**生产URL**: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/
**版本**: 1.0
