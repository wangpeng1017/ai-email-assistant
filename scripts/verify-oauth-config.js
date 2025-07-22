#!/usr/bin/env node

/**
 * OAuth配置验证脚本
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

console.log('🔍 OAuth配置验证');
console.log('=====================================\n');

// 验证环境变量
function verifyEnvironmentVariables() {
  console.log('📊 环境变量检查:');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ];
  
  let allValid = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`❌ ${varName}: 未设置`);
      allValid = false;
    }
  });
  
  return allValid;
}

// 生成配置指导
function generateConfigGuide() {
  const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  console.log('\n🛠️  配置指导:');
  console.log('');
  
  console.log('1. Google Cloud Console配置:');
  console.log('   访问: https://console.cloud.google.com/apis/credentials');
  console.log('   在OAuth 2.0客户端ID中添加以下重定向URI:');
  console.log(`   - ${productionUrl}/auth/callback`);
  console.log(`   - ${supabaseUrl}/auth/v1/callback`);
  console.log('');
  
  console.log('2. Supabase Dashboard配置:');
  console.log('   访问: https://supabase.com/dashboard/project/ulrvltozsppbskksycmg/auth/settings');
  console.log('   设置以下配置:');
  console.log(`   - Site URL: ${productionUrl}`);
  console.log(`   - Redirect URLs: ${productionUrl}/dashboard`);
  console.log('');
  
  console.log('3. Vercel环境变量配置:');
  console.log('   访问: https://vercel.com/dashboard');
  console.log('   在项目设置中添加环境变量:');
  console.log(`   - NEXT_PUBLIC_SITE_URL: ${productionUrl}`);
  console.log('');
}

// 生成测试指导
function generateTestGuide() {
  console.log('🧪 测试指导:');
  console.log('');
  
  console.log('1. 部署更新:');
  console.log('   git add .');
  console.log('   git commit -m "Fix Google OAuth redirect configuration"');
  console.log('   git push origin master');
  console.log('');
  
  console.log('2. 测试步骤:');
  console.log('   a. 等待Vercel部署完成');
  console.log('   b. 访问生产环境URL');
  console.log('   c. 点击"使用Google账号登录"');
  console.log('   d. 完成Google认证');
  console.log('   e. 验证是否正确重定向到生产环境/dashboard');
  console.log('');
  
  console.log('3. 调试方法:');
  console.log('   - 打开浏览器开发者工具');
  console.log('   - 查看Console日志中的重定向URL');
  console.log('   - 检查Network标签中的OAuth请求');
  console.log('');
}

// 主函数
function main() {
  const envValid = verifyEnvironmentVariables();
  
  if (!envValid) {
    console.log('\n❌ 环境变量配置不完整，请先修复环境变量配置。');
    return;
  }
  
  generateConfigGuide();
  generateTestGuide();
  
  console.log('✅ OAuth配置验证完成!');
  console.log('请按照上述指导完成配置，然后进行测试。');
}

main();
