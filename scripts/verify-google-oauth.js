const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function verifyGoogleOAuth() {
  console.log('🔍 Google OAuth 配置验证')
  console.log('=====================================\n')

  // 1. 检查环境变量
  console.log('📋 环境变量检查:')
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '已设置' : '❌ 未设置'}`)
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '已设置' : '❌ 未设置'}\n`)

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ 缺少必要的环境变量')
    return
  }

  // 2. 创建Supabase客户端
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 3. 检查Supabase连接
    console.log('📡 测试 Supabase 连接...')
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.log('❌ Supabase 连接失败:', error.message)
      return
    }
    
    console.log('✅ Supabase 连接成功')
    console.log(`   当前用户数: ${users.users.length}\n`)

    // 4. 检查Google OAuth用户
    const googleUsers = users.users.filter(user => 
      user.app_metadata?.provider === 'google' || 
      user.identities?.some(identity => identity.provider === 'google')
    )
    
    console.log('👥 Google OAuth 用户统计:')
    console.log(`📊 总用户数: ${users.users.length}`)
    console.log(`🔍 Google OAuth 用户数: ${googleUsers.length}\n`)

    if (googleUsers.length > 0) {
      console.log('✅ 发现 Google OAuth 用户，配置可能已完成')
      console.log('Google 用户详情:')
      googleUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (创建时间: ${new Date(user.created_at).toLocaleString()})`)
      })
    } else {
      console.log('⚠️  未发现 Google OAuth 用户')
      console.log('这可能意味着:')
      console.log('  1. Google Provider 尚未在 Supabase 中配置')
      console.log('  2. 配置已完成但尚未有用户通过 Google 登录')
      console.log('  3. 配置存在问题')
    }

    console.log('\n🔗 配置链接:')
    console.log('=====================================')
    console.log('• Supabase Dashboard:', `https://app.supabase.com/project/${supabaseUrl.split('.')[0].split('//')[1]}`)
    console.log('• Google Cloud Console: https://console.cloud.google.com/')
    console.log('• 本地应用: http://localhost:3000')

    console.log('\n📝 配置状态总结:')
    console.log('=====================================')
    console.log('✅ Supabase 项目: 已连接')
    console.log('✅ 环境变量: 已配置')
    console.log(`${googleUsers.length > 0 ? '✅' : '⚠️ '} Google OAuth: ${googleUsers.length > 0 ? '有用户使用' : '待验证'}`)

  } catch (error) {
    console.log('❌ 验证过程中出现错误:', error.message)
  }
}

verifyGoogleOAuth()
