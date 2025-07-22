import { NextRequest, NextResponse } from 'next/server'
import { createGmailOAuth2Client, validateGmailConfig } from '@/lib/gmailApi'

// Gmail OAuth授权URL生成
export async function GET(request: NextRequest) {
  try {
    // 验证Gmail配置
    validateGmailConfig()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }
    
    // 创建OAuth2客户端
    const oauth2Client = createGmailOAuth2Client()
    
    // 生成授权URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://mail.google.com/'
      ],
      state: userId, // 传递用户ID用于回调时识别
      prompt: 'consent' // 强制显示同意屏幕以获取refresh token
    })
    
    return NextResponse.json({
      authUrl,
      message: 'Gmail authorization URL generated successfully'
    })
    
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate Gmail authorization URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Gmail OAuth回调处理
export async function POST(request: NextRequest) {
  try {
    // 验证Gmail配置
    validateGmailConfig()
    
    const body = await request.json()
    const { code, state } = body
    
    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      )
    }
    
    // 创建OAuth2客户端
    const oauth2Client = createGmailOAuth2Client()
    
    // 交换授权码获取访问令牌
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      userId: state, // 返回用户ID
      message: 'Gmail authorization completed successfully'
    })
    
  } catch (error) {
    console.error('Error handling Gmail OAuth callback:', error)
    return NextResponse.json(
      { 
        error: 'Failed to complete Gmail authorization',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
