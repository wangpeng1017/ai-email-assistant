const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动 Next.js 开发服务器...');
console.log('工作目录:', process.cwd());

// 启动开发服务器
const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

nextProcess.on('error', (error) => {
  console.error('❌ 启动失败:', error);
});

nextProcess.on('close', (code) => {
  console.log(`🔚 进程退出，代码: ${code}`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭开发服务器...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});
