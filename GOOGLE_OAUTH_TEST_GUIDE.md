# Google OAuth生产环境测试指导

## 🎯 测试目标
验证测试账号 `test@ai-email-assistant.com` 在生产环境中的Google OAuth登录功能。

## 📋 前提条件

### 1. Google Cloud Console配置
确保以下配置已正确设置：

**授权重定向URI**:
```
https://your-vercel-domain.vercel.app/auth/callback
https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback
```

**授权域名**:
```
your-vercel-domain.vercel.app
ulrvltozsppbskksycmg.supabase.co
```

### 2. Supabase Auth配置
在Supabase Dashboard中确认：
- Google OAuth Provider已启用
- 重定向URL配置正确
- 站点URL设置为生产域名

## 🔧 测试步骤

### 步骤1: 访问生产环境
1. 打开浏览器访问您的Vercel生产URL
2. 确认页面正常加载，显示登录界面

### 步骤2: 测试Google OAuth登录
1. 点击"使用Google账号登录"按钮
2. 应该重定向到Google登录页面
3. 使用测试账号登录：
   - **邮箱**: test@ai-email-assistant.com
   - **密码**: TestUser123!

### 步骤3: 验证登录成功
登录成功后应该：
1. 重定向回应用仪表板
2. 显示用户信息：AI邮件助手测试用户
3. 能够访问所有功能模块

### 步骤4: 测试核心功能

#### 4.1 线索管理测试
- [ ] 查看线索列表（应显示5个测试线索）
- [ ] 检查不同状态的线索：
  - [ ] 张三科技有限公司 (pending)
  - [ ] 李四电商平台 (pending)  
  - [ ] 王五咨询服务 (completed)
  - [ ] 赵六制造企业 (processing)
  - [ ] 孙七教育机构 (failed)

#### 4.2 产品资料测试
- [ ] 查看产品资料列表（应显示4个测试文件）
- [ ] 验证文件信息显示正确

#### 4.3 AI邮件生成测试
- [ ] 选择一个pending状态的线索
- [ ] 点击"生成邮件"或"启动自动化"
- [ ] 验证AI邮件生成功能

#### 4.4 批量处理测试
- [ ] 尝试批量处理功能
- [ ] 检查处理状态更新

### 步骤5: 测试登出功能
- [ ] 点击登出按钮
- [ ] 确认成功登出并重定向到登录页面

## 🚨 常见问题排除

### 问题1: Google OAuth重定向错误
**症状**: 点击Google登录后出现重定向URI不匹配错误

**解决方案**:
1. 检查Google Cloud Console中的授权重定向URI
2. 确保包含正确的生产域名
3. 重新部署应用

### 问题2: 登录后无法访问数据
**症状**: 登录成功但看不到测试数据

**解决方案**:
1. 检查Supabase RLS策略
2. 确认用户ID匹配
3. 查看浏览器控制台错误

### 问题3: AI功能无法使用
**症状**: 邮件生成功能报错

**解决方案**:
1. 检查Gemini API密钥配置
2. 验证API配额和权限
3. 查看Vercel Function日志

## 📊 测试结果记录

### 基础功能测试
- [ ] ✅ Google OAuth登录成功
- [ ] ✅ 用户信息显示正确
- [ ] ✅ 仪表板正常加载
- [ ] ✅ 登出功能正常

### 数据访问测试
- [ ] ✅ 线索列表显示正确（5个）
- [ ] ✅ 产品资料列表显示正确（4个）
- [ ] ✅ 数据权限控制正常

### 功能测试
- [ ] ✅ 单个线索邮件生成
- [ ] ✅ 批量邮件生成
- [ ] ✅ 线索状态更新
- [ ] ✅ 错误处理显示

### 性能测试
- [ ] ✅ 页面加载速度正常
- [ ] ✅ API响应时间合理
- [ ] ✅ 无明显错误或警告

## 🔗 相关资源

### 生产环境信息
- **应用URL**: https://your-vercel-domain.vercel.app
- **Supabase项目**: https://ulrvltozsppbskksycmg.supabase.co
- **测试账号**: test@ai-email-assistant.com

### 管理面板
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com

## 📞 技术支持

如果测试过程中遇到问题，请提供：
1. 具体的错误信息截图
2. 浏览器控制台日志
3. 测试步骤和预期结果
4. 实际结果描述

## ✅ 测试完成确认

测试完成后，请确认：
- [ ] 所有核心功能正常工作
- [ ] 没有明显的错误或异常
- [ ] 用户体验流畅
- [ ] 数据安全和权限控制正确

---
**创建时间**: 2025-01-22
**测试账号**: test@ai-email-assistant.com
**版本**: 1.0
