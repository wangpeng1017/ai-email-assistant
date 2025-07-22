#!/usr/bin/env node

/**
 * Git性能监控脚本
 */

const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

function monitorGitPerformance() {
  console.log('📊 Git性能监控报告');
  console.log('===================\n');
  
  // 仓库大小
  const repoSize = runCommand('git count-objects -vH');
  console.log('📦 仓库大小信息:');
  console.log(repoSize);
  console.log('');
  
  // 最近提交
  const recentCommits = runCommand('git log --oneline -5');
  console.log('📝 最近5次提交:');
  console.log(recentCommits);
  console.log('');
  
  // 分支信息
  const branches = runCommand('git branch -v');
  console.log('🌿 分支信息:');
  console.log(branches);
  console.log('');
  
  // 远程信息
  const remotes = runCommand('git remote -v');
  console.log('🌐 远程仓库:');
  console.log(remotes);
  console.log('');
  
  // 状态检查
  const status = runCommand('git status --porcelain');
  if (status) {
    console.log('⚠️  未提交的更改:');
    console.log(status);
  } else {
    console.log('✅ 工作目录干净');
  }
  
  console.log('\n💡 性能建议:');
  console.log('- 定期运行 npm run optimize-git');
  console.log('- 保持提交小而频繁');
  console.log('- 及时清理临时文件');
  console.log('- 使用有意义的提交信息');
}

monitorGitPerformance();
