#!/usr/bin/env node

/**
 * 创建生产环境测试用户账号脚本
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

console.log('🚀 创建生产环境测试用户账号');
console.log('=====================================\n');

// 初始化Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已设置' : '未设置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 测试用户信息
const testUser = {
  email: 'test@ai-email-assistant.com',
  password: 'TestUser123!',
  user_metadata: {
    full_name: 'AI邮件助手测试用户',
    avatar_url: 'https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff'
  }
};

// 示例客户线索数据
const sampleLeads = [
  {
    customer_name: '张三科技有限公司',
    customer_email: 'zhangsan@techcompany.com',
    customer_website: 'https://www.techcompany.com',
    source: 'manual',
    status: 'pending'
  },
  {
    customer_name: '李四电商平台',
    customer_email: 'lisi@ecommerce.com',
    customer_website: 'https://www.ecommerce.com',
    source: 'manual',
    status: 'pending'
  },
  {
    customer_name: '王五咨询服务',
    customer_email: 'wangwu@consulting.com',
    customer_website: 'https://www.consulting.com',
    source: 'manual',
    status: 'completed',
    generated_mail_subject: '提升您的业务效率 - AI邮件自动化解决方案',
    generated_mail_body: '尊敬的王五先生，\n\n我们注意到您的咨询服务业务正在快速发展。我们的AI邮件自动化助手可以帮助您：\n\n1. 自动化客户沟通流程\n2. 提高邮件营销效率\n3. 个性化客户体验\n\n期待与您进一步交流。\n\n最好的问候'
  },
  {
    customer_name: '赵六制造企业',
    customer_email: 'zhaoliu@manufacturing.com',
    customer_website: 'https://www.manufacturing.com',
    source: 'excel',
    status: 'processing'
  },
  {
    customer_name: '孙七教育机构',
    customer_email: 'sunqi@education.com',
    customer_website: 'https://www.education.com',
    source: 'scraped',
    status: 'failed',
    error_message: '网站分析失败：无法访问目标网站'
  }
];

// 示例产品资料
const sampleMaterials = [
  {
    file_name: 'AI邮件自动化产品介绍.pdf',
    file_type: 'application/pdf',
    storage_path: 'test-materials/ai-email-automation-intro.pdf'
  },
  {
    file_name: '客户案例研究.docx',
    file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    storage_path: 'test-materials/customer-case-studies.docx'
  },
  {
    file_name: '产品定价方案.xlsx',
    file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    storage_path: 'test-materials/pricing-plans.xlsx'
  },
  {
    file_name: '技术规格说明.txt',
    file_type: 'text/plain',
    storage_path: 'test-materials/technical-specifications.txt'
  }
];

// 检查数据库表结构
async function checkDatabaseTables() {
  console.log('📊 检查数据库表结构...');
  
  try {
    // 检查leads表
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (leadsError) {
      console.log('❌ leads表检查失败:', leadsError.message);
    } else {
      console.log('✅ leads表存在');
    }
    
    // 检查product_materials表
    const { data: materialsData, error: materialsError } = await supabase
      .from('product_materials')
      .select('*')
      .limit(1);
    
    if (materialsError) {
      console.log('❌ product_materials表检查失败:', materialsError.message);
    } else {
      console.log('✅ product_materials表存在');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 创建测试用户
async function createTestUser() {
  console.log('\n👤 创建测试用户...');
  
  try {
    // 使用Supabase Auth创建用户
    const { data, error } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      user_metadata: testUser.user_metadata,
      email_confirm: true // 自动确认邮箱
    });
    
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        console.log('⚠️  用户已存在，尝试获取现有用户信息...');

        // 获取现有用户
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          throw listError;
        }

        const existingUser = existingUsers.users.find(u => u.email === testUser.email);
        if (existingUser) {
          console.log('✅ 找到现有测试用户:', existingUser.id);
          console.log('📧 邮箱:', existingUser.email);
          console.log('🆔 用户ID:', existingUser.id);
          return existingUser;
        } else {
          console.log('❌ 无法找到现有用户，但邮箱已被注册');
          throw new Error('用户邮箱已存在但无法获取用户信息');
        }
      }
      throw error;
    }
    
    console.log('✅ 测试用户创建成功');
    console.log('📧 邮箱:', data.user.email);
    console.log('🆔 用户ID:', data.user.id);
    
    return data.user;
  } catch (error) {
    console.error('❌ 创建用户失败:', error.message);
    throw error;
  }
}

// 创建示例线索数据
async function createSampleLeads(userId) {
  console.log('\n📋 创建示例客户线索...');
  
  try {
    const leadsWithUserId = sampleLeads.map(lead => ({
      ...lead,
      user_id: userId,
      created_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('leads')
      .insert(leadsWithUserId)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ 成功创建 ${data.length} 个示例线索`);
    data.forEach((lead, index) => {
      console.log(`   ${index + 1}. ${lead.customer_name} (${lead.status})`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ 创建示例线索失败:', error.message);
    throw error;
  }
}

// 创建示例产品资料
async function createSampleMaterials(userId) {
  console.log('\n📁 创建示例产品资料...');
  
  try {
    const materialsWithUserId = sampleMaterials.map(material => ({
      ...material,
      user_id: userId,
      created_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('product_materials')
      .insert(materialsWithUserId)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ 成功创建 ${data.length} 个示例产品资料`);
    data.forEach((material, index) => {
      console.log(`   ${index + 1}. ${material.file_name}`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ 创建示例产品资料失败:', error.message);
    throw error;
  }
}

// 生成测试报告
function generateTestReport(user, leads, materials) {
  console.log('\n📋 生成测试账号报告...');
  
  const report = `# 生产环境测试账号报告

## 账号信息
- **邮箱**: ${user.email}
- **密码**: ${testUser.password}
- **用户ID**: ${user.id}
- **创建时间**: ${new Date().toLocaleString()}

## 登录方式

### 方法1: Google OAuth登录
1. 访问生产环境URL
2. 点击"使用Google账号登录"
3. 使用邮箱: ${user.email}

### 方法2: 邮箱密码登录（如果支持）
- 邮箱: ${user.email}
- 密码: ${testUser.password}

## 测试数据

### 客户线索 (${leads.length}个)
${leads.map((lead, i) => `${i + 1}. ${lead.customer_name} - ${lead.status}`).join('\n')}

### 产品资料 (${materials.length}个)
${materials.map((material, i) => `${i + 1}. ${material.file_name}`).join('\n')}

## 功能测试清单

### ✅ 基础功能
- [ ] 登录/登出
- [ ] 仪表板访问
- [ ] 用户信息显示

### ✅ 线索管理
- [ ] 查看线索列表
- [ ] 添加新线索
- [ ] 编辑线索信息
- [ ] 删除线索
- [ ] 线索状态更新

### ✅ AI邮件生成
- [ ] 单个线索邮件生成
- [ ] 批量邮件生成
- [ ] 邮件内容预览
- [ ] 邮件内容编辑

### ✅ 产品资料管理
- [ ] 查看资料列表
- [ ] 上传新资料
- [ ] 删除资料
- [ ] 资料在邮件生成中的应用

### ✅ 自动化功能
- [ ] 启动单个线索自动化
- [ ] 启动批量自动化
- [ ] 查看处理状态
- [ ] 错误处理验证

## 生产环境信息
- **Supabase URL**: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
- **环境**: Production
- **创建时间**: ${new Date().toISOString()}

## 注意事项
1. 这是测试账号，请勿用于生产数据
2. 测试完成后可以删除测试数据
3. 如有问题请联系技术支持

---
生成时间: ${new Date().toLocaleString()}
`;
  
  fs.writeFileSync('PRODUCTION_TEST_ACCOUNT.md', report);
  console.log('✅ 测试账号报告已生成: PRODUCTION_TEST_ACCOUNT.md');
}

// 主函数
async function main() {
  try {
    // 检查数据库连接
    const dbOk = await checkDatabaseTables();
    if (!dbOk) {
      throw new Error('数据库连接失败');
    }
    
    // 创建测试用户
    const user = await createTestUser();
    
    // 创建示例数据
    const leads = await createSampleLeads(user.id);
    const materials = await createSampleMaterials(user.id);
    
    // 生成测试报告
    generateTestReport(user, leads, materials);
    
    console.log('\n🎉 生产环境测试账号创建完成!');
    console.log('=====================================');
    console.log('✅ 测试用户已创建');
    console.log('✅ 示例数据已添加');
    console.log('✅ 测试报告已生成');
    
    console.log('\n📧 登录信息:');
    console.log(`邮箱: ${user.email}`);
    console.log(`密码: ${testUser.password}`);
    
    console.log('\n🔗 下一步:');
    console.log('1. 访问生产环境应用');
    console.log('2. 使用上述凭据登录');
    console.log('3. 按照测试清单验证功能');
    console.log('4. 查看 PRODUCTION_TEST_ACCOUNT.md 获取详细信息');
    
  } catch (error) {
    console.error('❌ 创建过程中出现错误:', error.message);
    process.exit(1);
  }
}

main();
