#!/usr/bin/env node

/**
 * AI邮件自动化助手 - 快速设置脚本
 * 
 * 这个脚本帮助用户快速设置项目环境
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 AI邮件自动化助手 - 快速设置向导');
  console.log('=====================================\n');

  console.log('这个向导将帮助您配置项目环境变量。\n');

  // 检查是否已存在 .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local 文件已存在，是否覆盖？(y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('设置已取消。');
      rl.close();
      return;
    }
  }

  console.log('\n📋 请提供以下配置信息：\n');

  // Supabase 配置
  console.log('1. Supabase 配置');
  console.log('   请访问 https://app.supabase.com 获取以下信息：\n');
  
  const supabaseUrl = await question('   Supabase URL (https://your-project.supabase.co): ');
  const supabaseAnonKey = await question('   Supabase Anon Key: ');
  const supabaseServiceKey = await question('   Supabase Service Role Key: ');

  // Google AI 配置
  console.log('\n2. Google AI 配置');
  console.log('   请访问 https://aistudio.google.com 获取 API 密钥：\n');
  
  const geminiApiKey = await question('   Gemini API Key: ');

  // 验证输入
  const errors = [];
  
  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    errors.push('Supabase URL 格式不正确');
  }
  
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    errors.push('Supabase Anon Key 格式不正确');
  }
  
  if (!supabaseServiceKey || supabaseServiceKey.length < 20) {
    errors.push('Supabase Service Role Key 格式不正确');
  }
  
  if (!geminiApiKey || !geminiApiKey.startsWith('AIza')) {
    errors.push('Gemini API Key 格式不正确');
  }

  if (errors.length > 0) {
    console.log('\n❌ 配置验证失败：');
    errors.forEach(error => console.log(`   - ${error}`));
    console.log('\n请检查输入并重新运行设置脚本。');
    rl.close();
    return;
  }

  // 生成 .env.local 文件
  const envContent = `# AI邮件自动化助手 - 环境配置
# 由设置脚本自动生成于 ${new Date().toISOString()}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Google AI Configuration
GEMINI_API_KEY=${geminiApiKey}
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ 环境配置文件已创建成功！');
    
    console.log('\n📋 下一步操作：');
    console.log('   1. 在 Supabase 中执行数据库迁移脚本');
    console.log('      - 打开 Supabase Dashboard > SQL Editor');
    console.log('      - 复制并执行 supabase/migrations/001_initial_schema.sql');
    console.log('   2. 启动开发服务器：npm run dev');
    console.log('   3. 访问 http://localhost:3000 开始使用');
    
    console.log('\n📖 详细文档：');
    console.log('   - 完整设置指南：SETUP.md');
    console.log('   - 项目说明：README.md');
    console.log('   - 项目总结：PROJECT_SUMMARY.md');
    
  } catch (error) {
    console.log('\n❌ 创建配置文件失败：', error.message);
  }

  rl.close();
}

// 运行设置向导
main().catch(console.error);
