#!/usr/bin/env node

/**
 * 数据库表结构验证脚本
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
  console.log('🔍 验证数据库表结构...\n');

  try {
    // 检查leads表
    console.log('📋 检查 leads 表...');
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (leadsError) {
      console.log('❌ leads 表不存在或无法访问:', leadsError.message);
      return false;
    } else {
      console.log('✅ leads 表存在且可访问');
    }

    // 检查product_materials表
    console.log('📋 检查 product_materials 表...');
    const { data: materialsData, error: materialsError } = await supabase
      .from('product_materials')
      .select('*')
      .limit(1);

    if (materialsError) {
      console.log('❌ product_materials 表不存在或无法访问:', materialsError.message);
      return false;
    } else {
      console.log('✅ product_materials 表存在且可访问');
    }

    // 测试RLS策略
    console.log('\n🔒 测试 Row Level Security (RLS) 策略...');
    
    // 使用匿名密钥测试（应该被RLS阻止）
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: anonData, error: anonError } = await anonSupabase
      .from('leads')
      .select('*')
      .limit(1);

    if (anonError) {
      console.log('✅ RLS 策略正常工作（匿名访问被正确阻止）');
      console.log('   错误信息:', anonError.message);
    } else if (anonData && anonData.length === 0) {
      console.log('✅ RLS 策略正常工作（返回空结果）');
    } else {
      console.log('⚠️  RLS 可能未正确配置（匿名访问成功）');
    }

    return true;

  } catch (error) {
    console.log('❌ 数据库验证失败:', error.message);
    return false;
  }
}

async function testDatabaseOperations() {
  console.log('\n🧪 测试数据库基本操作...\n');

  try {
    // 首先创建一个测试用户
    console.log('👤 创建测试用户...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true
    });

    if (userError) {
      console.log('❌ 测试用户创建失败:', userError.message);
      return false;
    }

    const testUserId = userData.user.id;
    console.log('✅ 测试用户创建成功');

    // 测试插入操作（使用service key）
    console.log('📝 测试数据插入...');
    const testLead = {
      user_id: testUserId,
      source: 'manual',
      customer_website: 'https://test.example.com',
      customer_name: '测试客户',
      customer_email: 'test@example.com',
      status: 'pending'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();

    if (insertError) {
      console.log('❌ 数据插入失败:', insertError.message);
      return false;
    } else {
      console.log('✅ 数据插入成功');
      
      // 测试查询操作
      console.log('🔍 测试数据查询...');
      const { data: selectData, error: selectError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', insertData.id)
        .single();

      if (selectError) {
        console.log('❌ 数据查询失败:', selectError.message);
      } else {
        console.log('✅ 数据查询成功');
      }

      // 清理测试数据
      console.log('🧹 清理测试数据...');
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.log('⚠️  测试数据清理失败:', deleteError.message);
      } else {
        console.log('✅ 测试数据清理成功');
      }
    }

    // 清理测试用户
    console.log('🧹 清理测试用户...');
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(testUserId);
    if (deleteUserError) {
      console.log('⚠️  测试用户清理失败:', deleteUserError.message);
    } else {
      console.log('✅ 测试用户清理成功');
    }

    return true;

  } catch (error) {
    console.log('❌ 数据库操作测试失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🗄️  AI邮件自动化助手 - 数据库验证');
  console.log('=====================================\n');

  const tablesOk = await verifyTables();
  const operationsOk = await testDatabaseOperations();

  console.log('\n📊 验证结果总结:');
  console.log('================');
  console.log(`表结构: ${tablesOk ? '✅' : '❌'}`);
  console.log(`基本操作: ${operationsOk ? '✅' : '❌'}`);

  if (tablesOk && operationsOk) {
    console.log('\n🎉 数据库验证完全通过！数据库已准备就绪。');
  } else {
    console.log('\n⚠️  数据库验证存在问题，请检查配置。');
  }
}

main().catch(console.error);
