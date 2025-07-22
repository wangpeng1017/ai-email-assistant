#!/usr/bin/env node

/**
 * Google OAuth 配置测试脚本
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGoogleOAuthConfig() {
  console.log('🔍 Google OAuth 配置测试');
  console.log('=====================================\n');

  try {
    // 测试基本连接
    console.log('📡 测试 Supabase 连接...');
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Supabase 连接失败:', error.message);
      return false;
    }
    
    console.log('✅ Supabase 连接成功');
    console.log(`   当前用户数: ${data.users.length}`);

    // 检查环境变量
    console.log('\n🔧 检查环境变量...');
    console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '已设置' : '❌ 未设置'}`);
    console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '已设置' : '❌ 未设置'}`);

    // 提供配置指导
    console.log('\n📋 Google OAuth 配置检查清单:');
    console.log('=====================================');
    console.log('□ 1. Google Cloud Console 配置:');
    console.log('   □ 创建 OAuth 2.0 客户端 ID');
    console.log('   □ 配置授权重定向 URI:');
    console.log(`      - ${supabaseUrl}/auth/v1/callback`);
    console.log('   □ 启用 Google+ API 或 Google Identity API');
    console.log('');
    console.log('□ 2. Supabase Dashboard 配置:');
    console.log('   □ 启用 Google Provider');
    console.log('   □ 输入 Google Client ID');
    console.log('   □ 输入 Google Client Secret');
    console.log('   □ 配置重定向 URL:');
    console.log('      - http://localhost:3000/dashboard (开发)');
    console.log('      - https://your-domain.com/dashboard (生产)');
    console.log('');
    console.log('□ 3. 测试步骤:');
    console.log('   □ 启动开发服务器: npm run dev');
    console.log('   □ 访问: http://localhost:3000');
    console.log('   □ 点击 "使用 Google 账号登录"');
    console.log('   □ 验证重定向到 Google 登录页面');
    console.log('   □ 完成登录后验证重定向到仪表板');

    console.log('\n🔗 有用的链接:');
    console.log('=====================================');
    console.log('• Google Cloud Console: https://console.cloud.google.com/');
    console.log('• Supabase Dashboard: https://app.supabase.com/');
    console.log(`• 您的 Supabase 项目: https://app.supabase.com/project/${supabaseUrl.split('//')[1].split('.')[0]}`);

    return true;

  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
    return false;
  }
}

async function checkGoogleOAuthUsers() {
  console.log('\n👥 检查 Google OAuth 用户...');
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ 获取用户列表失败:', error.message);
      return;
    }

    const googleUsers = data.users.filter(user => 
      user.app_metadata?.providers?.includes('google') ||
      user.identities?.some(identity => identity.provider === 'google')
    );

    console.log(`📊 总用户数: ${data.users.length}`);
    console.log(`🔍 Google OAuth 用户数: ${googleUsers.length}`);

    if (googleUsers.length > 0) {
      console.log('\n📋 Google OAuth 用户列表:');
      googleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
        console.log(`      创建时间: ${new Date(user.created_at).toLocaleString('zh-CN')}`);
        console.log(`      最后登录: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('zh-CN') : '从未登录'}`);
      });
    }

  } catch (error) {
    console.log('❌ 检查用户时发生错误:', error.message);
  }
}

async function main() {
  const configOk = await testGoogleOAuthConfig();
  
  if (configOk) {
    await checkGoogleOAuthUsers();
    
    console.log('\n🎉 配置测试完成！');
    console.log('\n💡 下一步:');
    console.log('1. 按照上述检查清单完成 Google OAuth 配置');
    console.log('2. 运行 npm run dev 启动开发服务器');
    console.log('3. 测试 Google 登录功能');
  }
}

main().catch(console.error);
