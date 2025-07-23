// 产品资料API功能测试脚本
const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-123';

// 创建测试文件
function createTestFile(filename, content, size = 1024) {
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  const filePath = path.join(testDir, filename);
  const buffer = Buffer.alloc(size, content);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// 测试文件上传
async function testFileUpload() {
  console.log('\n🧪 测试1: 文件上传功能');
  
  try {
    // 创建测试文件
    const testFiles = [
      { name: 'test.pdf', content: 'PDF content', size: 1024 },
      { name: 'test.docx', content: 'Word content', size: 2048 },
      { name: 'test.jpg', content: 'Image content', size: 512 },
      { name: 'large-file.pdf', content: 'Large content', size: 11 * 1024 * 1024 } // 11MB - 应该失败
    ];
    
    for (const file of testFiles) {
      console.log(`\n📁 测试上传: ${file.name} (${file.size} bytes)`);
      
      const filePath = createTestFile(file.name, file.content, file.size);
      const formData = new FormData();
      
      // 读取文件并创建Blob
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer], { type: getFileType(file.name) });
      
      formData.append('file', blob, file.name);
      formData.append('userId', TEST_USER_ID);
      formData.append('description', `测试文件: ${file.name}`);
      
      try {
        const response = await fetch(`${BASE_URL}/api/materials/upload`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log(`✅ ${file.name} 上传成功`);
          console.log(`   - ID: ${result.data.id}`);
          console.log(`   - 存储路径: ${result.data.storage_path}`);
        } else {
          console.log(`❌ ${file.name} 上传失败: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ ${file.name} 上传异常: ${error.message}`);
      }
      
      // 清理测试文件
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('❌ 文件上传测试失败:', error.message);
  }
}

// 测试获取材料列表
async function testGetMaterials() {
  console.log('\n🧪 测试2: 获取材料列表');
  
  try {
    const response = await fetch(`${BASE_URL}/api/materials/upload?userId=${TEST_USER_ID}`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ 获取材料列表成功`);
      console.log(`   - 材料数量: ${result.data.length}`);
      
      result.data.forEach((material, index) => {
        console.log(`   ${index + 1}. ${material.file_name}`);
        console.log(`      - ID: ${material.id}`);
        console.log(`      - 大小: ${material.file_size} bytes`);
        console.log(`      - 类型: ${material.file_type}`);
        console.log(`      - 创建时间: ${material.created_at}`);
      });
      
      return result.data;
    } else {
      console.log(`❌ 获取材料列表失败: ${result.error}`);
      return [];
    }
  } catch (error) {
    console.error('❌ 获取材料列表异常:', error.message);
    return [];
  }
}

// 测试文件下载
async function testFileDownload(materials) {
  console.log('\n🧪 测试3: 文件下载功能');
  
  if (materials.length === 0) {
    console.log('⚠️ 没有可下载的文件');
    return;
  }
  
  for (const material of materials.slice(0, 3)) { // 只测试前3个文件
    console.log(`\n📥 测试下载: ${material.file_name}`);
    
    try {
      const response = await fetch(
        `${BASE_URL}/api/materials/download?id=${material.id}&userId=${TEST_USER_ID}`
      );
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        
        console.log(`✅ ${material.file_name} 下载成功`);
        console.log(`   - 内容长度: ${contentLength} bytes`);
        console.log(`   - 内容类型: ${contentType}`);
        
        // 验证文件内容
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 0) {
          console.log(`   - 文件内容完整 (${arrayBuffer.byteLength} bytes)`);
        } else {
          console.log(`   - ⚠️ 文件内容为空`);
        }
      } else {
        const result = await response.json();
        console.log(`❌ ${material.file_name} 下载失败: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${material.file_name} 下载异常: ${error.message}`);
    }
  }
}

// 测试错误处理
async function testErrorHandling() {
  console.log('\n🧪 测试4: 错误处理');
  
  // 测试无效用户ID
  console.log('\n🔒 测试无效用户ID');
  try {
    const response = await fetch(`${BASE_URL}/api/materials/upload?userId=invalid-user`);
    const result = await response.json();
    console.log(`✅ 无效用户ID处理: ${result.success ? '失败' : '成功'}`);
  } catch (error) {
    console.log(`❌ 无效用户ID测试异常: ${error.message}`);
  }
  
  // 测试下载不存在的文件
  console.log('\n📥 测试下载不存在的文件');
  try {
    const response = await fetch(
      `${BASE_URL}/api/materials/download?id=non-existent-id&userId=${TEST_USER_ID}`
    );
    const result = await response.json();
    console.log(`✅ 不存在文件处理: ${result.success ? '失败' : '成功'}`);
  } catch (error) {
    console.log(`❌ 不存在文件测试异常: ${error.message}`);
  }
}

// 获取文件MIME类型
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始产品资料API综合测试');
  console.log(`📍 测试服务器: ${BASE_URL}`);
  console.log(`👤 测试用户ID: ${TEST_USER_ID}`);
  
  try {
    // 检查服务器是否运行
    const healthCheck = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!healthCheck) {
      console.log('⚠️ 无法连接到开发服务器，请确保 npm run dev 正在运行');
      return;
    }
    
    // 运行测试
    await testFileUpload();
    const materials = await testGetMaterials();
    await testFileDownload(materials);
    await testErrorHandling();
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
