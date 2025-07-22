# OAuth URL路径重复修复指导

## 🚨 问题描述
Google OAuth登录后重定向到错误的URL，出现路径重复导致404错误。

**错误URL**: `/dashboard/dashboard#access_token=...`
**正确URL**: `/dashboard#access_token=...`

## ✅ 已实施的代码修复

### 1. AuthContext URL标准化
- ✅ 添加了 `normalizeUrl` 函数防止路径重复
- ✅ 智能检测URL是否已包含目标路径
- ✅ 增强的调试日志输出
- ✅ 多层级的URL构造逻辑

### 2. 修复逻辑
```javascript
const normalizeUrl = (baseUrl: string, path: string = '/dashboard') => {
  // 移除baseUrl末尾的斜杠
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  // 确保path以斜杠开头
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // 检查baseUrl是否已经包含了path
  if (cleanBaseUrl.endsWith(cleanPath)) {
    return cleanBaseUrl; // 避免重复
  }
  return `${cleanBaseUrl}${cleanPath}`;
};
```

## 🔧 需要检查的配置

### 1. Vercel环境变量检查 ⚠️ **重要**

访问: https://vercel.com/dashboard
检查项目环境变量中的 `NEXT_PUBLIC_SITE_URL` 设置：

**正确设置**:
```
NEXT_PUBLIC_SITE_URL=https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
```

**错误设置** (可能导致重复):
```
NEXT_PUBLIC_SITE_URL=https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/dashboard
```

### 2. Supabase Auth配置检查

访问: https://supabase.com/dashboard/project/ulrvltozsppbskksycmg/auth/settings

**Site URL**:
```
https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
```

**Redirect URLs**:
```
https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/dashboard
```

### 3. Google Cloud Console配置

访问: https://console.cloud.google.com/apis/credentials

**授权重定向URI**:
```
https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback
https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback
```

## 🚀 部署和测试

### 部署修复
```bash
git add .
git commit -m "Fix OAuth URL path duplication issue"
git push origin master
```

### 测试步骤

1. **等待部署完成**
   - 在Vercel Dashboard确认部署状态为"Ready"

2. **测试OAuth流程**
   - 访问: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/
   - 点击"使用Google账号登录"
   - 使用您的Google账号: wangpeng1017414@gmail.com

3. **验证重定向**
   - 应该重定向到: `.../dashboard#access_token=...`
   - 不应该是: `.../dashboard/dashboard#access_token=...`
   - 应该显示dashboard页面，不是404错误

## 🔍 调试方法

### 浏览器调试
1. **打开开发者工具** (F12)
2. **查看Console日志**，应该看到：
   ```
   🌐 使用环境变量站点URL: https://...
   🔧 构造重定向URL: https://... + /dashboard = https://.../dashboard
   ✅ 最终OAuth重定向URL: https://.../dashboard
   ```

3. **检查Network标签**
   - 查看OAuth重定向请求
   - 确认redirectTo参数正确

### 预期的调试输出
```
🌐 使用环境变量站点URL: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app
🔧 构造重定向URL: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app + /dashboard = https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/dashboard
✅ 最终OAuth重定向URL: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/dashboard
```

## 🚨 故障排除

### 问题1: 仍然出现路径重复
**可能原因**: Vercel环境变量设置错误
**解决方案**: 检查并修正 `NEXT_PUBLIC_SITE_URL` 环境变量

### 问题2: 404错误持续
**可能原因**: Supabase重定向配置错误
**解决方案**: 重新配置Supabase Auth设置

### 问题3: OAuth认证失败
**可能原因**: Google Cloud Console配置不完整
**解决方案**: 检查授权重定向URI配置

### 问题4: 环境变量未生效
**可能原因**: 部署后环境变量未更新
**解决方案**: 重新部署项目

## ✅ 验证清单

- [ ] 代码修复已部署
- [ ] Vercel环境变量正确设置
- [ ] Supabase Auth配置正确
- [ ] Google Cloud Console配置完整
- [ ] OAuth重定向到正确URL (单个/dashboard)
- [ ] Dashboard页面正常显示
- [ ] 用户可以成功登录

## 📊 测试用例

### 成功案例
- **输入**: 点击Google登录
- **预期**: 重定向到 `.../dashboard#access_token=...`
- **结果**: 显示dashboard页面

### 失败案例
- **输入**: 点击Google登录
- **错误**: 重定向到 `.../dashboard/dashboard#access_token=...`
- **结果**: 404错误页面

## 📞 技术支持

如果问题仍然存在，请提供：
1. 浏览器Console完整日志
2. Network标签中的OAuth请求详情
3. 当前的重定向URL
4. Vercel和Supabase配置截图

---
**修复时间**: 2025-01-22
**问题**: OAuth URL路径重复导致404错误
**解决方案**: URL标准化和配置检查
**版本**: 1.0
