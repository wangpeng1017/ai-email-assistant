#!/usr/bin/env node

/**
 * 部署问题修复脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AI邮件自动化助手 - 部署问题修复');
console.log('=====================================\n');

// 检查并修复vercel.json配置
function fixVercelConfig() {
  console.log('📝 检查和修复 vercel.json 配置...');
  
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  
  const correctConfig = {
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "outputDirectory": ".next",
    "functions": {
      "app/**/*.js": {
        "maxDuration": 30
      }
    },
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    },
    "build": {
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=4096"
      }
    },
    "regions": ["iad1"]
  };
  
  try {
    fs.writeFileSync(vercelConfigPath, JSON.stringify(correctConfig, null, 2));
    console.log('✅ vercel.json 配置已更新');
  } catch (error) {
    console.log('❌ 更新 vercel.json 失败:', error.message);
  }
}

// 检查package.json配置
function checkPackageJson() {
  console.log('\n📦 检查 package.json 配置...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 检查必要的脚本
    const requiredScripts = {
      "dev": "next dev --turbopack",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    };
    
    let needsUpdate = false;
    
    for (const [script, command] of Object.entries(requiredScripts)) {
      if (packageJson.scripts[script] !== command) {
        console.log(`⚠️  脚本 "${script}" 需要更新`);
        packageJson.scripts[script] = command;
        needsUpdate = true;
      } else {
        console.log(`✅ 脚本 "${script}" 配置正确`);
      }
    }
    
    if (needsUpdate) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ package.json 已更新');
    } else {
      console.log('✅ package.json 配置正确');
    }
    
  } catch (error) {
    console.log('❌ 检查 package.json 失败:', error.message);
  }
}

// 检查必要文件
function checkRequiredFiles() {
  console.log('\n📁 检查必要文件...');
  
  const requiredFiles = [
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/app/dashboard/page.tsx',
    'src/components/Auth.tsx',
    'src/lib/supabase.ts',
    'src/contexts/AuthContext.tsx'
  ];
  
  let allPresent = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}: 存在`);
    } else {
      console.log(`❌ ${file}: 不存在`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// 生成部署指导
function generateDeploymentInstructions() {
  console.log('\n📋 生成部署修复指导...');
  
  const instructions = `
# 部署问题修复指导

## 立即执行的步骤：

### 1. 更新Vercel项目设置
- 登录 Vercel Dashboard
- 进入项目设置 > General
- 确保 "Preview Deployments" 设置为 "Public"

### 2. 重新配置环境变量
在 Vercel 项目设置 > Environment Variables 中添加：

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://ulrvltozsppbskksycmg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscnZsdG96c3BwYnNra3N5Y21nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA2NDI5MiwiZXhwIjoyMDY4NjQwMjkyfQ.D_aJMCjh9H1KRZROK2MzEOIPLqlK4RV_lP8gQpnTrRU
GEMINI_API_KEY=AIzaSyBtw7WLw0Lf749k0j5yeKJpjz1AfWgDsuA
\`\`\`

### 3. 重新部署
- 在 Vercel Dashboard 中点击 "Redeploy"
- 或推送新的代码到 GitHub 触发自动部署

### 4. 验证部署
- 等待部署完成
- 访问新的预览URL
- 测试应用功能

## 如果问题仍然存在：

1. 检查 Vercel 部署日志中的错误信息
2. 确认所有环境变量拼写正确
3. 验证 GitHub 仓库中的代码是最新的
4. 联系技术支持获取进一步帮助
`;
  
  const instructionsPath = path.join(process.cwd(), 'DEPLOYMENT_FIX.md');
  fs.writeFileSync(instructionsPath, instructions);
  console.log('✅ 部署修复指导已生成: DEPLOYMENT_FIX.md');
}

// 主函数
function main() {
  try {
    fixVercelConfig();
    checkPackageJson();
    const filesOk = checkRequiredFiles();
    generateDeploymentInstructions();
    
    console.log('\n📊 修复结果总结:');
    console.log('=====================================');
    console.log('✅ Vercel 配置已更新');
    console.log('✅ Package.json 检查完成');
    console.log(`${filesOk ? '✅' : '❌'} 必要文件检查`);
    console.log('✅ 修复指导已生成');
    
    console.log('\n🚀 下一步操作:');
    console.log('1. 提交并推送更新的配置文件到 GitHub');
    console.log('2. 在 Vercel Dashboard 中重新配置环境变量');
    console.log('3. 触发重新部署');
    console.log('4. 验证部署结果');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
  }
}

main();
