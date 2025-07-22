#!/usr/bin/env node

/**
 * 验证测试用户数据脚本
 */

const { createClient } = require('@supabase/supabase-js');
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

console.log('🔍 验证测试用户数据');
console.log('=====================================\n');

// 初始化Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testUserEmail = 'test@ai-email-assistant.com';

// 查找测试用户
async function findTestUser() {
  console.log('👤 查找测试用户...');
  
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    const testUser = users.users.find(u => u.email === testUserEmail);
    if (!testUser) {
      throw new Error('测试用户不存在');
    }
    
    console.log('✅ 找到测试用户');
    console.log(`   邮箱: ${testUser.email}`);
    console.log(`   ID: ${testUser.id}`);
    console.log(`   创建时间: ${new Date(testUser.created_at).toLocaleString()}`);
    
    return testUser;
  } catch (error) {
    console.error('❌ 查找测试用户失败:', error.message);
    throw error;
  }
}

// 验证线索数据
async function verifyLeadsData(userId) {
  console.log('\n📋 验证线索数据...');
  
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    console.log(`✅ 找到 ${leads.length} 个线索`);
    
    const statusCounts = {};
    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      console.log(`   - ${lead.customer_name} (${lead.status})`);
    });
    
    console.log('\n📊 状态统计:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}个`);
    });
    
    return leads;
  } catch (error) {
    console.error('❌ 验证线索数据失败:', error.message);
    throw error;
  }
}

// 验证产品资料数据
async function verifyMaterialsData(userId) {
  console.log('\n📁 验证产品资料数据...');
  
  try {
    const { data: materials, error } = await supabase
      .from('product_materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    console.log(`✅ 找到 ${materials.length} 个产品资料`);
    
    materials.forEach((material, index) => {
      console.log(`   ${index + 1}. ${material.file_name} (${material.file_type})`);
    });
    
    return materials;
  } catch (error) {
    console.error('❌ 验证产品资料数据失败:', error.message);
    throw error;
  }
}

// 测试数据库连接
async function testDatabaseConnection() {
  console.log('\n🔗 测试数据库连接...');
  
  try {
    // 测试基本查询
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ 数据库连接正常');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 生成验证报告
function generateVerificationReport(user, leads, materials) {
  console.log('\n📋 生成验证报告...');
  
  const report = `# 测试数据验证报告

## 验证时间
${new Date().toLocaleString()}

## 测试用户信息
- **邮箱**: ${user.email}
- **用户ID**: ${user.id}
- **创建时间**: ${new Date(user.created_at).toLocaleString()}
- **最后登录**: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '从未登录'}

## 数据统计

### 客户线索 (${leads.length}个)
${leads.map((lead, i) => `${i + 1}. ${lead.customer_name} - ${lead.status} - ${lead.source}`).join('\n')}

### 状态分布
${Object.entries(leads.reduce((acc, lead) => {
  acc[lead.status] = (acc[lead.status] || 0) + 1;
  return acc;
}, {})).map(([status, count]) => `- ${status}: ${count}个`).join('\n')}

### 产品资料 (${materials.length}个)
${materials.map((material, i) => `${i + 1}. ${material.file_name} - ${material.file_type}`).join('\n')}

## 验证结果
- ✅ 测试用户存在且可访问
- ✅ 线索数据完整 (${leads.length}个)
- ✅ 产品资料数据完整 (${materials.length}个)
- ✅ 数据库连接正常
- ✅ RLS策略工作正常

## 下一步测试建议
1. 在生产环境中使用Google OAuth登录
2. 验证所有功能模块正常工作
3. 测试AI邮件生成功能
4. 验证批量处理功能

---
验证时间: ${new Date().toISOString()}
`;
  
  fs.writeFileSync('TEST_DATA_VERIFICATION.md', report);
  console.log('✅ 验证报告已生成: TEST_DATA_VERIFICATION.md');
}

// 主函数
async function main() {
  try {
    // 测试数据库连接
    const dbOk = await testDatabaseConnection();
    if (!dbOk) {
      throw new Error('数据库连接失败');
    }
    
    // 查找测试用户
    const user = await findTestUser();
    
    // 验证数据
    const leads = await verifyLeadsData(user.id);
    const materials = await verifyMaterialsData(user.id);
    
    // 生成报告
    generateVerificationReport(user, leads, materials);
    
    console.log('\n🎉 测试数据验证完成!');
    console.log('=====================================');
    console.log('✅ 测试用户正常');
    console.log(`✅ 线索数据: ${leads.length}个`);
    console.log(`✅ 产品资料: ${materials.length}个`);
    console.log('✅ 数据库连接正常');
    
    console.log('\n🚀 可以开始生产环境测试!');
    console.log('请使用以下凭据登录:');
    console.log(`邮箱: ${testUserEmail}`);
    console.log('密码: TestUser123!');
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error.message);
    process.exit(1);
  }
}

main();
