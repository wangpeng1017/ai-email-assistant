#!/usr/bin/env node

/**
 * 环境变量验证脚本 - 用于构建前验证
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
          // 移除引号
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    });
  }
}

// 加载环境变量文件
loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

console.log('🔍 环境变量验证 - AI邮件自动化助手');
console.log('=====================================\n');

// 验证URL格式
function validateUrl(url, name) {
  if (!url) {
    console.log(`❌ ${name}: 未设置`);
    return false;
  }

  if (url.trim() === '') {
    console.log(`❌ ${name}: 空值`);
    return false;
  }

  // 移除末尾斜杠
  const cleanedUrl = url.trim().replace(/\/+$/, '');
  
  try {
    new URL(cleanedUrl);
    console.log(`✅ ${name}: ${cleanedUrl}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: 无效URL格式 - "${url}"`);
    return false;
  }
}

// 验证密钥格式
function validateKey(key, name, minLength = 10) {
  if (!key) {
    console.log(`❌ ${name}: 未设置`);
    return false;
  }

  if (key.trim() === '') {
    console.log(`❌ ${name}: 空值`);
    return false;
  }

  if (key.includes('placeholder')) {
    console.log(`❌ ${name}: 包含占位符值`);
    return false;
  }

  if (key.length < minLength) {
    console.log(`❌ ${name}: 长度不足 (${key.length} < ${minLength})`);
    return false;
  }

  console.log(`✅ ${name}: 已设置 (长度: ${key.length})`);
  return true;
}

// 检查.env文件
function checkEnvFiles() {
  console.log('📁 检查环境变量文件...');
  
  const envFiles = ['.env.local', '.env', '.env.example'];
  let foundEnvFile = false;

  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ 找到环境文件: ${file}`);
      foundEnvFile = true;
      
      // 读取并显示环境变量（不显示值）
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      console.log(`   包含 ${lines.length} 个环境变量`);
    }
  });

  if (!foundEnvFile) {
    console.log('⚠️  未找到环境变量文件');
  }
  
  console.log('');
}

// 主验证函数
function validateEnvironment() {
  console.log('🔧 验证环境变量...');
  
  let allValid = true;

  // 验证Supabase配置
  console.log('\n📊 Supabase配置:');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!validateUrl(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')) allValid = false;
  if (!validateKey(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 50)) allValid = false;
  if (!validateKey(supabaseServiceKey, 'SUPABASE_SERVICE_ROLE_KEY', 50)) allValid = false;

  // 验证Gemini配置
  console.log('\n🤖 Gemini AI配置:');
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!validateKey(geminiApiKey, 'GEMINI_API_KEY', 30)) allValid = false;

  // 验证Next.js配置
  console.log('\n⚙️  Next.js配置:');
  const nodeEnv = process.env.NODE_ENV;
  console.log(`📍 NODE_ENV: ${nodeEnv || '未设置'}`);

  return allValid;
}

// 生成环境变量模板
function generateEnvTemplate() {
  console.log('\n📝 生成环境变量模板...');
  
  const template = `# AI邮件自动化助手 - 环境变量配置

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI配置
GEMINI_API_KEY=your-gemini-api-key

# Next.js配置
NODE_ENV=development

# 注意事项:
# 1. 确保Supabase URL不包含末尾斜杠
# 2. 所有密钥都应该是完整的，不包含占位符
# 3. 在生产环境中，这些值应该在Vercel中配置
`;

  fs.writeFileSync('.env.example', template);
  console.log('✅ 环境变量模板已生成: .env.example');
}

// 修复常见问题
function suggestFixes() {
  console.log('\n💡 常见问题修复建议:');
  console.log('');
  
  console.log('1. 如果Supabase URL无效:');
  console.log('   - 检查URL是否包含末尾斜杠，应该移除');
  console.log('   - 确保URL格式为: https://your-project.supabase.co');
  console.log('   - 登录Supabase Dashboard确认项目URL');
  console.log('');
  
  console.log('2. 如果密钥无效:');
  console.log('   - 确保密钥完整复制，没有截断');
  console.log('   - 检查是否包含占位符文本');
  console.log('   - 重新生成密钥如果需要');
  console.log('');
  
  console.log('3. Vercel部署问题:');
  console.log('   - 在Vercel项目设置中重新配置环境变量');
  console.log('   - 确保环境变量应用到Production, Preview, Development');
  console.log('   - 重新部署项目');
  console.log('');
}

// 主函数
function main() {
  try {
    checkEnvFiles();
    const isValid = validateEnvironment();
    
    if (isValid) {
      console.log('\n🎉 所有环境变量验证通过!');
      console.log('✅ 项目可以正常构建和部署');
    } else {
      console.log('\n❌ 环境变量验证失败!');
      console.log('⚠️  请修复上述问题后重试');
      generateEnvTemplate();
      suggestFixes();
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error.message);
    process.exit(1);
  }
}

main();
