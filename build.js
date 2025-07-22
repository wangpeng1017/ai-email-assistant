const { spawn } = require('child_process');

// 设置Node.js内存限制
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

console.log('🚀 开始构建项目...');
console.log('内存限制:', process.env.NODE_OPTIONS);

const buildProcess = spawn('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ 构建成功完成！');
  } else {
    console.log('❌ 构建失败，退出代码:', code);
  }
  process.exit(code);
});

buildProcess.on('error', (error) => {
  console.error('❌ 构建过程中出现错误:', error);
  process.exit(1);
});
