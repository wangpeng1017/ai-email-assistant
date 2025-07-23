#!/usr/bin/env node

/**
 * Gmail API配置验证脚本
 * 验证提供的Gmail API凭据是否正确配置
 */

console.log('🔍 Gmail API配置验证');
console.log('=====================================\n');

// Gmail API配置模板 (实际值需要从用户获取)
const gmailConfig = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '[用户提供的Client ID]',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '[用户提供的Client Secret]',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/auth/callback'
};

console.log('📋 Gmail API配置信息:');
console.log('=====================================');

// 验证Client ID
console.log('✅ GOOGLE_CLIENT_ID');
console.log(`   值: ${gmailConfig.GOOGLE_CLIENT_ID}`);
console.log(`   格式: ${gmailConfig.GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com') ? '✅ 正确' : '❌ 错误'}`);
console.log(`   项目ID: ${gmailConfig.GOOGLE_CLIENT_ID.split('-')[0]}`);
console.log('');

// 验证Client Secret
console.log('✅ GOOGLE_CLIENT_SECRET');
console.log(`   值: ${gmailConfig.GOOGLE_CLIENT_SECRET.substring(0, 15)}...`);
console.log(`   格式: ${gmailConfig.GOOGLE_CLIENT_SECRET.startsWith('GOCSPX-') ? '✅ 正确' : '❌ 错误'}`);
console.log('');

// 验证Redirect URI
console.log('✅ GOOGLE_REDIRECT_URI');
console.log(`   值: ${gmailConfig.GOOGLE_REDIRECT_URI}`);
console.log(`   协议: ${gmailConfig.GOOGLE_REDIRECT_URI.startsWith('https://') ? '✅ HTTPS' : '❌ 非HTTPS'}`);
console.log(`   域名: ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app`);
console.log(`   路径: /auth/callback`);
console.log('');

console.log('🔧 Vercel配置指令:');
console.log('=====================================');
console.log('在Vercel Dashboard中添加以下环境变量:\n');

console.log('1. GOOGLE_CLIENT_ID');
console.log(`   值: ${gmailConfig.GOOGLE_CLIENT_ID.includes('[用户提供') ? '[请使用用户提供的实际Client ID]' : gmailConfig.GOOGLE_CLIENT_ID}`);
console.log('   环境: Production, Preview, Development\n');

console.log('2. GOOGLE_CLIENT_SECRET');
console.log(`   值: ${gmailConfig.GOOGLE_CLIENT_SECRET.includes('[用户提供') ? '[请使用用户提供的实际Client Secret]' : gmailConfig.GOOGLE_CLIENT_SECRET}`);
console.log('   环境: Production, Preview, Development\n');

console.log('3. GOOGLE_REDIRECT_URI');
console.log(`   值: ${gmailConfig.GOOGLE_REDIRECT_URI}`);
console.log('   环境: Production, Preview, Development\n');

console.log('🔒 Google Cloud Console验证清单:');
console.log('=====================================');
console.log('请确认以下设置已在Google Cloud Console中配置:\n');

console.log('✅ 1. Gmail API已启用');
console.log('   - 访问: https://console.cloud.google.com/');
console.log('   - APIs & Services → Library');
console.log('   - 搜索并启用 "Gmail API"\n');

console.log('✅ 2. OAuth2客户端已创建');
console.log('   - APIs & Services → Credentials');
console.log('   - OAuth client ID类型: Web application\n');

console.log('✅ 3. 授权重定向URI已配置');
console.log('   必须包含以下URI:');
console.log(`   - ${gmailConfig.GOOGLE_REDIRECT_URI}`);
console.log('   - https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback\n');

console.log('✅ 4. OAuth同意屏幕已配置');
console.log('   - 应用名称: AI邮件自动化助手');
console.log('   - 授权域名: vercel.app');
console.log('   - 范围包含:');
console.log('     * https://www.googleapis.com/auth/gmail.compose');
console.log('     * https://www.googleapis.com/auth/gmail.modify');
console.log('     * https://mail.google.com/\n');

console.log('🚀 部署后测试步骤:');
console.log('=====================================');
console.log('1. 在Vercel中配置上述环境变量');
console.log('2. 触发新的部署 (或等待自动部署)');
console.log('3. 访问应用并测试Gmail连接功能');
console.log('4. 检查OAuth授权流程是否正常工作\n');

console.log('📞 故障排除:');
console.log('=====================================');
console.log('如果遇到OAuth错误:');
console.log('- 检查重定向URI是否完全匹配');
console.log('- 确认Gmail API已启用');
console.log('- 验证OAuth同意屏幕配置');
console.log('- 检查应用是否在测试模式 (如需要，发布应用)\n');

console.log('✅ Gmail API配置验证完成！');
console.log('现在可以在Vercel中配置这些环境变量了。');
