
# 部署问题修复指导

## 立即执行的步骤：

### 1. 更新Vercel项目设置
- 登录 Vercel Dashboard
- 进入项目设置 > General
- 确保 "Preview Deployments" 设置为 "Public"

### 2. 重新配置环境变量
在 Vercel 项目设置 > Environment Variables 中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://ulrvltozsppbskksycmg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscnZsdG96c3BwYnNra3N5Y21nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA2NDI5MiwiZXhwIjoyMDY4NjQwMjkyfQ.D_aJMCjh9H1KRZROK2MzEOIPLqlK4RV_lP8gQpnTrRU
GEMINI_API_KEY=AIzaSyBtw7WLw0Lf749k0j5yeKJpjz1AfWgDsuA
```

### 3. 重新部署
- 在 Vercel Dashboard 中点击 "Redeploy"
- 或推送新的代码到 GitHub 触发自动部署

### 4. 验证部署
- 等待部署完成
- 访问新的预览URL
- 测试应用功能

## 如果问题仍然存在：

1. 检查 Vercel 部署日志中的错误信息
2. 确认所有环境变量拼写正确
3. 验证 GitHub 仓库中的代码是最新的
4. 联系技术支持获取进一步帮助
