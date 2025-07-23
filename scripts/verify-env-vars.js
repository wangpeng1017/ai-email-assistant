#!/usr/bin/env node

/**
 * 环境变量验证脚本
 * 检查所有必需的环境变量是否正确配置
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

console.log('🔍 环境变量验证');
console.log('=====================================\n');

// 定义必需的环境变量
const requiredVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase项目URL',
    required: true,
    example: 'https://your-project.supabase.co'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase匿名密钥',
    required: true,
    example: 'eyJ...'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase服务角色密钥',
    required: true,
    example: 'eyJ...'
  },
  {
    name: 'GEMINI_API_KEY',
    description: 'Google Gemini AI API密钥',
    required: true,
    example: 'AIza...'
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    description: 'Google OAuth客户端ID',
    required: true,
    example: 'your-client-id.apps.googleusercontent.com'
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    description: 'Google OAuth客户端密钥',
    required: true,
    example: 'GOCSPX-...'
  },
  {
    name: 'GOOGLE_REDIRECT_URI',
    description: 'Google OAuth重定向URI',
    required: true,
    example: 'https://your-domain.vercel.app/auth/callback'
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    description: '站点URL（用于OAuth重定向）',
    required: false,
    example: 'https://your-domain.vercel.app'
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'NextAuth会话密钥',
    required: false,
    example: '32字符随机字符串'
  },
  {
    name: 'NEXTAUTH_URL',
    description: 'NextAuth基础URL',
    required: false,
    example: 'https://your-domain.vercel.app'
  }
];

// 验证结果
const results = {
  configured: [],
  missing: [],
  invalid: []
};

console.log('📋 环境变量检查结果:\n');

requiredVars.forEach(varConfig => {
  const value = process.env[varConfig.name];
  const status = value ? '✅' : (varConfig.required ? '❌' : '⚠️');
  const statusText = value ? '已配置' : (varConfig.required ? '缺失' : '可选');
  
  console.log(`${status} ${varConfig.name}`);
  console.log(`   描述: ${varConfig.description}`);
  console.log(`   状态: ${statusText}`);
  
  if (value) {
    // 验证值的格式
    let isValid = true;
    let validationMessage = '';
    
    switch (varConfig.name) {
      case 'NEXT_PUBLIC_SUPABASE_URL':
        isValid = value.startsWith('https://') && value.includes('.supabase.co');
        validationMessage = isValid ? '' : '应该是https://开头的Supabase URL';
        break;
      case 'GEMINI_API_KEY':
        isValid = value.startsWith('AIza');
        validationMessage = isValid ? '' : '应该以AIza开头';
        break;
      case 'GOOGLE_CLIENT_ID':
        isValid = value.includes('.apps.googleusercontent.com');
        validationMessage = isValid ? '' : '应该以.apps.googleusercontent.com结尾';
        break;
      case 'GOOGLE_CLIENT_SECRET':
        isValid = value.startsWith('GOCSPX-') || value.length > 20;
        validationMessage = isValid ? '' : '格式可能不正确';
        break;
      case 'GOOGLE_REDIRECT_URI':
      case 'NEXT_PUBLIC_SITE_URL':
      case 'NEXTAUTH_URL':
        isValid = value.startsWith('https://');
        validationMessage = isValid ? '' : '应该使用HTTPS协议';
        break;
      case 'NEXTAUTH_SECRET':
        isValid = value.length >= 32;
        validationMessage = isValid ? '' : '应该至少32字符长';
        break;
    }
    
    if (isValid) {
      console.log(`   值: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
      results.configured.push(varConfig.name);
    } else {
      console.log(`   值: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
      console.log(`   ⚠️  警告: ${validationMessage}`);
      results.invalid.push({ name: varConfig.name, message: validationMessage });
    }
  } else {
    console.log(`   示例: ${varConfig.example}`);
    if (varConfig.required) {
      results.missing.push(varConfig.name);
    }
  }
  
  console.log('');
});

// 总结报告
console.log('📊 验证总结:');
console.log('=====================================');
console.log(`✅ 已配置: ${results.configured.length} 个`);
console.log(`❌ 缺失必需: ${results.missing.length} 个`);
console.log(`⚠️  格式警告: ${results.invalid.length} 个`);
console.log('');

if (results.missing.length > 0) {
  console.log('🚨 缺失的必需环境变量:');
  results.missing.forEach(name => {
    const config = requiredVars.find(v => v.name === name);
    console.log(`   - ${name}: ${config.description}`);
  });
  console.log('');
}

if (results.invalid.length > 0) {
  console.log('⚠️  格式警告:');
  results.invalid.forEach(item => {
    console.log(`   - ${item.name}: ${item.message}`);
  });
  console.log('');
}

// 部署建议
console.log('🚀 Vercel部署建议:');
console.log('=====================================');

if (results.missing.length === 0 && results.invalid.length === 0) {
  console.log('✅ 所有环境变量配置正确，可以部署到Vercel！');
} else {
  console.log('❌ 需要修复以下问题后再部署:');
  
  if (results.missing.length > 0) {
    console.log('\n1. 在Vercel中添加缺失的环境变量:');
    console.log('   - 访问: https://vercel.com/dashboard');
    console.log('   - 选择项目 → Settings → Environment Variables');
    console.log('   - 添加上述缺失的变量');
  }
  
  if (results.invalid.length > 0) {
    console.log('\n2. 修复格式错误的环境变量');
  }
  
  console.log('\n3. 重新部署项目');
}

console.log('\n📖 详细配置指南: 查看 VERCEL_ENVIRONMENT_VARIABLES.md');

// 退出码
process.exit(results.missing.length > 0 ? 1 : 0);
