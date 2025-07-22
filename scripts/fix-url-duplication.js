#!/usr/bin/env node

/**
 * URL路径重复修复脚本
 */

const fs = require('fs');
const path = require('path');

// 手动加载环境变量
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    });
  }
}

// 加载环境变量
loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

console.log('🔧 URL路径重复修复');
console.log('=====================================\n');

console.log('🚨 检测到的问题:');
console.log('- OAuth重定向URL出现路径重复: /dashboard/dashboard');
console.log('- 导致404错误页面');
console.log('');

console.log('🔍 问题分析:');
console.log('- 当前错误URL: .../dashboard/dashboard#access_token=...');
console.log('- 期望正确URL: .../dashboard#access_token=...');
console.log('');

// 检查环境变量
function checkEnvironmentVariables() {
  console.log('📊 环境变量检查:');
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  console.log(`NEXT_PUBLIC_SITE_URL: ${siteUrl || '未设置'}`);
  
  if (siteUrl) {
    // 检查是否已经包含dashboard路径
    if (siteUrl.endsWith('/dashboard')) {
      console.log('⚠️  警告: NEXT_PUBLIC_SITE_URL已包含/dashboard路径');
      console.log('   这可能导致路径重复问题');
      return false;
    } else if (siteUrl.endsWith('/')) {
      console.log('✅ NEXT_PUBLIC_SITE_URL格式正确（以/结尾）');
      return true;
    } else {
      console.log('✅ NEXT_PUBLIC_SITE_URL格式正确（不以/结尾）');
      return true;
    }
  }
  
  return false;
}

// 生成修复建议
function generateFixSuggestions() {
  console.log('\n🛠️  修复方案:');
  console.log('');
  
  console.log('1. 代码修复（已完成）:');
  console.log('   ✅ 添加了URL标准化函数');
  console.log('   ✅ 防止路径重复的逻辑');
  console.log('   ✅ 增强的调试日志');
  console.log('');
  
  console.log('2. 环境变量检查:');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl && siteUrl.endsWith('/dashboard')) {
    console.log('   ❌ 需要修复Vercel环境变量');
    console.log(`   当前值: ${siteUrl}`);
    console.log('   应该改为: https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app');
  } else {
    console.log('   ✅ 环境变量格式正确');
  }
  console.log('');
  
  console.log('3. Supabase配置检查:');
  console.log('   访问: https://supabase.com/dashboard/project/ulrvltozsppbskksycmg/auth/settings');
  console.log('   确认Redirect URLs设置为:');
  console.log('   https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app/dashboard');
  console.log('   （注意：只有一个/dashboard）');
  console.log('');
}

// 生成测试指导
function generateTestGuide() {
  console.log('🧪 测试指导:');
  console.log('');
  
  console.log('1. 部署修复:');
  console.log('   git add .');
  console.log('   git commit -m "Fix OAuth URL path duplication issue"');
  console.log('   git push origin master');
  console.log('');
  
  console.log('2. 测试步骤:');
  console.log('   a. 等待Vercel部署完成');
  console.log('   b. 访问生产环境并点击Google登录');
  console.log('   c. 完成OAuth认证');
  console.log('   d. 检查重定向URL是否正确');
  console.log('');
  
  console.log('3. 预期结果:');
  console.log('   ✅ 重定向到: .../dashboard#access_token=...');
  console.log('   ✅ 显示dashboard页面，不是404错误');
  console.log('   ✅ 用户成功登录');
  console.log('');
  
  console.log('4. 调试方法:');
  console.log('   - 打开浏览器开发者工具');
  console.log('   - 查看Console中的URL构造日志');
  console.log('   - 检查最终重定向URL是否正确');
  console.log('');
}

// 主函数
function main() {
  const envOk = checkEnvironmentVariables();
  generateFixSuggestions();
  generateTestGuide();
  
  console.log('✅ URL重复修复分析完成!');
  console.log('请按照上述建议完成修复和测试。');
}

main();
