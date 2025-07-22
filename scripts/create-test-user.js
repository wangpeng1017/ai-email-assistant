#!/usr/bin/env node

/**
 * 创建测试账户脚本
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('👤 创建AI邮件自动化助手测试账户');
  console.log('=====================================\n');

  const testUserData = {
    email: 'test@ai-email-assistant.demo',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: {
      full_name: '测试用户',
      role: 'test_user'
    }
  };

  try {
    // 检查用户是否已存在
    console.log('🔍 检查测试用户是否已存在...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ 检查用户失败:', listError.message);
      return;
    }

    const existingUser = existingUsers.users.find(user => user.email === testUserData.email);
    
    if (existingUser) {
      console.log('✅ 测试用户已存在');
      console.log(`   用户ID: ${existingUser.id}`);
      console.log(`   邮箱: ${existingUser.email}`);
      console.log(`   创建时间: ${new Date(existingUser.created_at).toLocaleString('zh-CN')}`);
      
      // 重置密码以确保密码正确
      console.log('\n🔄 重置测试用户密码...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: testUserData.password }
      );
      
      if (updateError) {
        console.log('❌ 密码重置失败:', updateError.message);
      } else {
        console.log('✅ 密码重置成功');
      }
      
      return existingUser;
    }

    // 创建新的测试用户
    console.log('📝 创建新的测试用户...');
    const { data: userData, error: createError } = await supabase.auth.admin.createUser(testUserData);

    if (createError) {
      console.log('❌ 测试用户创建失败:', createError.message);
      return;
    }

    console.log('✅ 测试用户创建成功！');
    console.log(`   用户ID: ${userData.user.id}`);
    console.log(`   邮箱: ${userData.user.email}`);
    console.log(`   创建时间: ${new Date(userData.user.created_at).toLocaleString('zh-CN')}`);

    return userData.user;

  } catch (error) {
    console.log('❌ 创建测试用户时发生错误:', error.message);
  }
}

async function createTestLeads(userId) {
  console.log('\n📋 创建测试线索数据...');

  const testLeads = [
    {
      user_id: userId,
      source: 'manual',
      customer_website: 'https://www.baidu.com',
      customer_name: '百度公司',
      customer_email: 'contact@baidu.com',
      status: 'pending'
    },
    {
      user_id: userId,
      source: 'manual',
      customer_website: 'https://www.github.com',
      customer_name: 'GitHub Inc',
      customer_email: 'hello@github.com',
      status: 'pending'
    },
    {
      user_id: userId,
      source: 'manual',
      customer_website: 'https://www.taobao.com',
      customer_name: '淘宝网',
      customer_email: 'service@taobao.com',
      status: 'pending'
    }
  ];

  try {
    // 清理现有的测试数据
    console.log('🧹 清理现有测试数据...');
    await supabase
      .from('leads')
      .delete()
      .eq('user_id', userId);

    // 插入新的测试数据
    console.log('📝 插入测试线索数据...');
    const { data: insertData, error: insertError } = await supabase
      .from('leads')
      .insert(testLeads)
      .select();

    if (insertError) {
      console.log('❌ 测试数据创建失败:', insertError.message);
      return;
    }

    console.log('✅ 测试线索数据创建成功！');
    console.log(`   创建了 ${insertData.length} 条测试线索`);
    
    insertData.forEach((lead, index) => {
      console.log(`   ${index + 1}. ${lead.customer_name} - ${lead.customer_website}`);
    });

  } catch (error) {
    console.log('❌ 创建测试数据时发生错误:', error.message);
  }
}

async function main() {
  const user = await createTestUser();
  
  if (user) {
    await createTestLeads(user.id);
    
    console.log('\n🎉 测试环境准备完成！');
    console.log('\n📋 测试账户信息:');
    console.log('================');
    console.log('邮箱: test@ai-email-assistant.demo');
    console.log('密码: TestPassword123!');
    console.log('\n🚀 现在可以开始功能测试了！');
    console.log('   1. 访问 http://localhost:3000');
    console.log('   2. 使用上述账户信息登录');
    console.log('   3. 查看预置的测试线索数据');
    console.log('   4. 测试AI邮件生成功能');
  }
}

main().catch(console.error);
