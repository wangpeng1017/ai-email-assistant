import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 获取用户信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }
    
    // 检查Gmail认证状态
    const { data: gmailAuth, error } = await supabaseAdmin
      .from('gmail_auth')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking Gmail auth status:', error)
      return NextResponse.json(
        { error: 'Failed to check Gmail auth status' },
        { status: 500 }
      )
    }
    
    const hasAuth = !!gmailAuth?.access_token
    const isExpired = gmailAuth?.expires_at ? new Date(gmailAuth.expires_at) < new Date() : true
    
    return NextResponse.json({
      hasAuth,
      isExpired,
      expiresAt: gmailAuth?.expires_at || null
    })
    
  } catch (error) {
    console.error('Error in Gmail auth status check:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check Gmail auth status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
