#!/usr/bin/env node

/**
 * AI邮件自动化助手 - 配置测试脚本
 * 
 * 验证环境配置是否正确
 */

require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 测试 Supabase 连接...');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.log('❌ Supabase 环境变量未配置');
    return false;
  }
  
  if (url.includes('placeholder') || key.includes('placeholder')) {
    console.log('❌ Supabase 环境变量使用占位符值');
    return false;
  }
  
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase 连接成功');
      return true;
    } else {
      console.log('❌ Supabase 连接失败:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase 连接错误:', error.message);
    return false;
  }
}

async function testGeminiAPI() {
  console.log('🔍 测试 Gemini API...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Gemini API 密钥未配置');
    return false;
  }
  
  if (apiKey.includes('placeholder')) {
    console.log('❌ Gemini API 密钥使用占位符值');
    return false;
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello'
            }]
          }]
        })
      }
    );
    
    if (response.ok) {
      console.log('✅ Gemini API 连接成功');
      return true;
    } else {
      console.log('❌ Gemini API 连接失败:', response.status);
      const errorText = await response.text();
      console.log('   错误详情:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API 连接错误:', error.message);
    return false;
  }
}

function checkEnvironmentVariables() {
  console.log('🔍 检查环境变量...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName} 未设置`);
      allPresent = false;
    } else if (value.includes('placeholder') || value.includes('your_')) {
      console.log(`❌ ${varName} 使用占位符值`);
      allPresent = false;
    } else {
      console.log(`✅ ${varName} 已设置`);
    }
  });
  
  return allPresent;
}

async function main() {
  console.log('🧪 AI邮件自动化助手 - 配置测试');
  console.log('=====================================\n');
  
  // 检查 .env.local 文件
  const fs = require('fs');
  if (!fs.existsSync('.env.local')) {
    console.log('❌ .env.local 文件不存在');
    console.log('   请运行: npm run setup');
    return;
  }
  
  console.log('✅ .env.local 文件存在\n');
  
  // 检查环境变量
  const envCheck = checkEnvironmentVariables();
  console.log('');
  
  if (!envCheck) {
    console.log('❌ 环境变量配置不完整，请检查 .env.local 文件');
    return;
  }
  
  // 测试服务连接
  const supabaseOk = await testSupabaseConnection();
  const geminiOk = await testGeminiAPI();
  
  console.log('\n📊 测试结果总结:');
  console.log('================');
  console.log(`环境变量: ${envCheck ? '✅' : '❌'}`);
  console.log(`Supabase: ${supabaseOk ? '✅' : '❌'}`);
  console.log(`Gemini AI: ${geminiOk ? '✅' : '❌'}`);
  
  if (envCheck && supabaseOk && geminiOk) {
    console.log('\n🎉 所有配置测试通过！可以开始使用应用了。');
    console.log('   运行: npm run dev');
  } else {
    console.log('\n⚠️  部分配置测试失败，请检查配置后重试。');
    console.log('   参考: SETUP.md 获取详细设置指南');
  }
}

main().catch(console.error);
