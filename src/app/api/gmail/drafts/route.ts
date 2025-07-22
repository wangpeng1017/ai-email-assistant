import { NextRequest, NextResponse } from 'next/server'
import { createGmailOAuth2Client, setGmailCredentials, listDrafts, deleteDraft, sendDraft, validateGmailConfig } from '@/lib/gmailApi'
import { supabaseAdmin } from '@/lib/supabase'

// 获取草稿列表
export async function GET(request: NextRequest) {
  try {
    validateGmailConfig()
    
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const maxResults = parseInt(searchParams.get('maxResults') || '10')
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing accessToken parameter' },
        { status: 400 }
      )
    }
    
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
    
    // 创建OAuth2客户端
    const oauth2Client = createGmailOAuth2Client()
    setGmailCredentials(oauth2Client, accessToken, refreshToken || undefined)
    
    // 获取草稿列表
    const drafts = await listDrafts(oauth2Client, maxResults)
    
    return NextResponse.json({
      success: true,
      drafts,
      count: drafts.length
    })
    
  } catch (error) {
    console.error('Error listing Gmail drafts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list Gmail drafts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 删除草稿
export async function DELETE(request: NextRequest) {
  try {
    validateGmailConfig()
    
    const body = await request.json()
    const { draftId, accessToken, refreshToken } = body
    
    if (!draftId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: draftId, accessToken' },
        { status: 400 }
      )
    }
    
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
    
    // 创建OAuth2客户端
    const oauth2Client = createGmailOAuth2Client()
    setGmailCredentials(oauth2Client, accessToken, refreshToken)
    
    // 删除草稿
    await deleteDraft(oauth2Client, draftId)
    
    // 更新数据库中相关线索的状态
    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        gmail_draft_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('gmail_draft_id', draftId)
      .eq('user_id', user.id)
    
    if (updateError) {
      console.error('Error updating lead after draft deletion:', updateError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting Gmail draft:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete Gmail draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 发送草稿
export async function POST(request: NextRequest) {
  try {
    validateGmailConfig()
    
    const body = await request.json()
    const { draftId, accessToken, refreshToken } = body
    
    if (!draftId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: draftId, accessToken' },
        { status: 400 }
      )
    }
    
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
    
    // 创建OAuth2客户端
    const oauth2Client = createGmailOAuth2Client()
    setGmailCredentials(oauth2Client, accessToken, refreshToken)
    
    // 发送草稿
    const sentMessage = await sendDraft(oauth2Client, draftId)
    
    // 更新数据库中相关线索的状态
    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        status: 'sent',
        gmail_draft_id: null,
        gmail_message_id: sentMessage.id,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('gmail_draft_id', draftId)
      .eq('user_id', user.id)
    
    if (updateError) {
      console.error('Error updating lead after sending:', updateError)
    }
    
    return NextResponse.json({
      success: true,
      messageId: sentMessage.id,
      threadId: sentMessage.threadId,
      message: 'Draft sent successfully'
    })
    
  } catch (error) {
    console.error('Error sending Gmail draft:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send Gmail draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
