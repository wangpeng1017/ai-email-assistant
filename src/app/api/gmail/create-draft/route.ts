import { NextRequest, NextResponse } from 'next/server'
import { createGmailOAuth2Client, setGmailCredentials, createEmailDraft, validateGmailConfig } from '@/lib/gmailApi'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // 验证Gmail配置
    validateGmailConfig()
    
    const body = await request.json()
    const { leadId, emailContent, accessToken, refreshToken } = body
    
    // 验证必要参数
    if (!leadId || !emailContent || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: leadId, emailContent, accessToken' },
        { status: 400 }
      )
    }
    
    // 验证邮件内容
    if (!emailContent.to || !emailContent.subject || !emailContent.body) {
      return NextResponse.json(
        { error: 'Invalid email content: missing to, subject, or body' },
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
    
    // 创建邮件草稿
    const draftResponse = await createEmailDraft(oauth2Client, {
      to: emailContent.to,
      subject: emailContent.subject,
      body: emailContent.body,
      attachments: emailContent.attachments
    })
    
    // 更新数据库中的线索状态
    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        status: 'completed',
        generated_mail_subject: emailContent.subject,
        generated_mail_body: emailContent.body,
        gmail_draft_id: draftResponse.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('user_id', user.id)
    
    if (updateError) {
      console.error('Error updating lead:', updateError)
      // 即使数据库更新失败，草稿已创建，所以返回成功
    }
    
    return NextResponse.json({
      success: true,
      draftId: draftResponse.id,
      messageId: draftResponse.message.id,
      threadId: draftResponse.message.threadId,
      message: 'Email draft created successfully'
    })
    
  } catch (error) {
    console.error('Error creating Gmail draft:', error)
    
    // 根据错误类型返回不同的状态码
    if (error instanceof Error) {
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Gmail authentication failed. Please re-authorize.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Gmail API quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create Gmail draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
