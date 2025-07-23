import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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
    
    // 删除Gmail认证信息
    const { error } = await supabaseAdmin
      .from('gmail_auth')
      .delete()
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error revoking Gmail auth:', error)
      return NextResponse.json(
        { error: 'Failed to revoke Gmail authorization' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Gmail authorization revoked successfully'
    })
    
  } catch (error) {
    console.error('Error in Gmail auth revocation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to revoke Gmail authorization',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
