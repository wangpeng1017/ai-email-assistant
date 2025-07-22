#!/usr/bin/env node

/**
 * 部署前检查脚本
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 AI邮件自动化助手 - 部署前检查');
console.log('=====================================\n');

// 检查环境变量
function checkEnvironmentVariables() {
  console.log('📋 检查环境变量...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: 已设置`);
    } else {
      console.log(`❌ ${varName}: 未设置`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// 检查Supabase连接
async function checkSupabaseConnection() {
  console.log('\n📡 检查Supabase连接...');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Supabase环境变量未设置');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ Supabase连接失败:', error.message);
      return false;
    }
    
    console.log('✅ Supabase连接成功');
    console.log(`   用户数量: ${data.users.length}`);
    return true;
    
  } catch (error) {
    console.log('❌ Supabase连接错误:', error.message);
    return false;
  }
}

// 检查必要文件
function checkRequiredFiles() {
  console.log('\n📁 检查必要文件...');
  
  const requiredFiles = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    '.env.local',
    'vercel.json'
  ];
  
  let allPresent = true;
  
  requiredFiles.forEach(fileName => {
    const filePath = path.join(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${fileName}: 存在`);
    } else {
      console.log(`❌ ${fileName}: 不存在`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// 生成部署配置
function generateDeploymentConfig() {
  console.log('\n⚙️  生成部署配置...');
  
  const deploymentConfig = {
    vercel: {
      projectName: 'ai-email-assistant',
      framework: 'nextjs',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      environmentVariables: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY', 
        'GEMINI_API_KEY'
      ]
    },
    googleOAuth: {
      redirectURIs: [
        'https://ulrvltozsppbskksycmg.supabase.co/auth/v1/callback'
      ],
      authorizedDomains: [
        'localhost:3000',
        'your-app.vercel.app' // 需要替换为实际域名
      ]
    },
    supabase: {
      redirectURLs: [
        'http://localhost:3000/dashboard',
        'https://your-app.vercel.app/dashboard' // 需要替换为实际域名
      ]
    }
  };
  
  console.log('✅ 部署配置已生成');
  return deploymentConfig;
}

// 主函数
async function main() {
  try {
    const envCheck = checkEnvironmentVariables();
    const supabaseCheck = await checkSupabaseConnection();
    const filesCheck = checkRequiredFiles();
    const deploymentConfig = generateDeploymentConfig();
    
    console.log('\n📊 检查结果总结:');
    console.log('=====================================');
    console.log(`环境变量: ${envCheck ? '✅ 通过' : '❌ 失败'}`);
    console.log(`Supabase连接: ${supabaseCheck ? '✅ 通过' : '❌ 失败'}`);
    console.log(`必要文件: ${filesCheck ? '✅ 通过' : '❌ 失败'}`);
    
    if (envCheck && supabaseCheck && filesCheck) {
      console.log('\n🎉 项目已准备好部署到Vercel！');
      
      console.log('\n📋 下一步操作:');
      console.log('1. 将代码推送到GitHub仓库');
      console.log('2. 在Vercel中创建新项目');
      console.log('3. 连接GitHub仓库');
      console.log('4. 配置环境变量');
      console.log('5. 部署项目');
      console.log('6. 更新Google OAuth和Supabase配置');
      
    } else {
      console.log('\n⚠️  请先解决上述问题，然后重新运行检查');
    }
    
    // 输出配置信息
    console.log('\n🔧 部署配置信息:');
    console.log(JSON.stringify(deploymentConfig, null, 2));
    
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error.message);
  }
}

main();
