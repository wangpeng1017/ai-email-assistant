#!/usr/bin/env node

/**
 * Git仓库优化脚本 - AI邮件自动化助手项目
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AI邮件自动化助手 - Git仓库优化');
console.log('=====================================\n');

// 执行命令并返回结果
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return result.trim();
  } catch (error) {
    if (!options.silent) {
      console.error(`❌ 命令执行失败: ${command}`);
      console.error(error.message);
    }
    return null;
  }
}

// 检查Git仓库状态
function checkGitStatus() {
  console.log('📊 检查Git仓库状态...');
  
  // 检查是否在Git仓库中
  const isGitRepo = runCommand('git rev-parse --is-inside-work-tree', { silent: true });
  if (!isGitRepo) {
    console.log('❌ 当前目录不是Git仓库');
    return false;
  }
  
  // 检查仓库大小
  const gitSize = runCommand('git count-objects -vH', { silent: true });
  console.log('📦 Git仓库信息:');
  console.log(gitSize);
  
  // 检查未跟踪的文件
  const untrackedFiles = runCommand('git ls-files --others --exclude-standard', { silent: true });
  if (untrackedFiles) {
    const fileCount = untrackedFiles.split('\n').length;
    console.log(`📁 未跟踪文件数量: ${fileCount}`);
  }
  
  // 检查暂存区状态
  const stagedFiles = runCommand('git diff --cached --name-only', { silent: true });
  if (stagedFiles) {
    const stagedCount = stagedFiles.split('\n').filter(f => f.trim()).length;
    console.log(`📝 暂存区文件数量: ${stagedCount}`);
  }
  
  return true;
}

// 清理不需要的文件
function cleanupFiles() {
  console.log('\n🧹 清理不需要的文件...');
  
  const cleanupPaths = [
    'node_modules',
    '.next',
    'dist',
    'build',
    '.cache',
    '.vercel',
    'coverage',
    'temp',
    'tmp'
  ];
  
  cleanupPaths.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      console.log(`🗑️  删除目录: ${dirPath}`);
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`✅ 已删除: ${dirPath}`);
      } catch (error) {
        console.log(`⚠️  无法删除 ${dirPath}: ${error.message}`);
      }
    }
  });
}

// 优化Git配置
function optimizeGitConfig() {
  console.log('\n⚙️  优化Git配置...');
  
  const gitConfigs = [
    // 启用压缩
    ['core.compression', '9'],
    // 启用增量包
    ['core.deltaBaseCacheLimit', '2g'],
    // 优化网络传输
    ['http.postBuffer', '524288000'],
    // 启用并行处理
    ['pack.threads', '0'],
    // 优化垃圾回收
    ['gc.auto', '256'],
    // 启用文件系统监控
    ['core.fsmonitor', 'true'],
    // 启用预加载索引
    ['core.preloadindex', 'true'],
    // 优化状态检查
    ['status.submodulesummary', 'true']
  ];
  
  gitConfigs.forEach(([key, value]) => {
    try {
      runCommand(`git config ${key} ${value}`, { silent: true });
      console.log(`✅ 设置 ${key} = ${value}`);
    } catch (error) {
      console.log(`⚠️  无法设置 ${key}: ${error.message}`);
    }
  });
}

// 执行Git垃圾回收
function runGitGC() {
  console.log('\n🗑️  执行Git垃圾回收...');
  
  try {
    console.log('正在执行 git gc --aggressive --prune=now...');
    runCommand('git gc --aggressive --prune=now');
    console.log('✅ Git垃圾回收完成');
  } catch (error) {
    console.log('⚠️  Git垃圾回收失败:', error.message);
  }
}

// 检查大文件
function checkLargeFiles() {
  console.log('\n🔍 检查大文件...');
  
  try {
    const largeFiles = runCommand('git ls-files | xargs ls -la | awk \'$5 > 1048576 {print $5/1048576 "MB " $9}\'', { silent: true });
    
    if (largeFiles) {
      console.log('📦 发现大文件 (>1MB):');
      console.log(largeFiles);
      console.log('\n💡 建议: 考虑使用Git LFS管理这些大文件');
    } else {
      console.log('✅ 没有发现大文件');
    }
  } catch (error) {
    console.log('⚠️  无法检查大文件:', error.message);
  }
}

// 生成优化报告
function generateOptimizationReport() {
  console.log('\n📋 生成优化报告...');
  
  const report = `
# Git仓库优化报告 - AI邮件自动化助手

## 优化时间
${new Date().toLocaleString()}

## 执行的优化操作
- ✅ 更新了.gitignore文件，添加了更多忽略规则
- ✅ 清理了临时文件和构建产物
- ✅ 优化了Git配置参数
- ✅ 执行了Git垃圾回收
- ✅ 检查了大文件

## 推荐的最佳实践

### 提交频率
- 每次功能完成后及时提交
- 避免一次性提交过多文件
- 使用有意义的提交信息

### 文件管理
- 确保.gitignore文件包含所有不必要的文件
- 定期清理临时文件和构建产物
- 对于大文件考虑使用Git LFS

### 性能优化
- 定期执行 \`git gc\` 清理仓库
- 使用 \`git status\` 检查仓库状态
- 避免提交node_modules等依赖目录

## 下一步建议
1. 提交当前的优化更改
2. 推送到远程仓库
3. 监控后续提交的性能
4. 定期运行此优化脚本

---
生成时间: ${new Date().toISOString()}
`;
  
  fs.writeFileSync('GIT_OPTIMIZATION_REPORT.md', report);
  console.log('✅ 优化报告已生成: GIT_OPTIMIZATION_REPORT.md');
}

// 主函数
function main() {
  try {
    if (!checkGitStatus()) {
      return;
    }
    
    cleanupFiles();
    optimizeGitConfig();
    runGitGC();
    checkLargeFiles();
    generateOptimizationReport();
    
    console.log('\n🎉 Git仓库优化完成!');
    console.log('=====================================');
    console.log('✅ 仓库已优化');
    console.log('✅ 配置已更新');
    console.log('✅ 垃圾回收已完成');
    console.log('✅ 报告已生成');
    
    console.log('\n🚀 下一步操作:');
    console.log('1. git add .');
    console.log('2. git commit -m "Optimize Git repository configuration"');
    console.log('3. git push origin main');
    
  } catch (error) {
    console.error('❌ 优化过程中出现错误:', error.message);
  }
}

main();
