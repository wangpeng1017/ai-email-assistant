import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

// Gmail API配置
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://mail.google.com/'
]

// 邮件草稿接口
export interface EmailDraft {
  to: string
  subject: string
  body: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType: string
}

export interface GmailDraftResponse {
  id: string
  message: {
    id: string
    threadId: string
  }
}

// 创建OAuth2客户端
export function createGmailOAuth2Client(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  
  return oauth2Client
}

// 设置访问令牌
export function setGmailCredentials(oauth2Client: OAuth2Client, accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })
}

// 创建邮件草稿
export async function createEmailDraft(
  oauth2Client: OAuth2Client, 
  draft: EmailDraft
): Promise<GmailDraftResponse> {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    
    // 构建邮件内容
    const emailContent = createEmailMessage(draft)
    
    // 创建草稿
    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: emailContent
        }
      }
    })
    
    if (!response.data.id || !response.data.message) {
      throw new Error('Failed to create draft: Invalid response')
    }
    
    return {
      id: response.data.id,
      message: {
        id: response.data.message.id!,
        threadId: response.data.message.threadId!
      }
    }
  } catch (error) {
    console.error('Error creating Gmail draft:', error)
    throw new Error(`Failed to create Gmail draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 构建邮件消息
function createEmailMessage(draft: EmailDraft): string {
  const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9)
  
  let message = [
    `To: ${draft.to}`,
    `Subject: ${draft.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    encodeQuotedPrintable(draft.body),
    ''
  ]
  
  // 添加附件
  if (draft.attachments && draft.attachments.length > 0) {
    for (const attachment of draft.attachments) {
      message.push(`--${boundary}`)
      message.push(`Content-Type: ${attachment.contentType}`)
      message.push(`Content-Disposition: attachment; filename="${attachment.filename}"`)
      message.push('Content-Transfer-Encoding: base64')
      message.push('')
      
      // 转换附件内容为base64
      const base64Content = Buffer.isBuffer(attachment.content) 
        ? attachment.content.toString('base64')
        : Buffer.from(attachment.content).toString('base64')
      
      // 分行显示base64内容
      const lines = base64Content.match(/.{1,76}/g) || []
      message.push(...lines)
      message.push('')
    }
  }
  
  message.push(`--${boundary}--`)
  
  // 编码为base64url
  const rawMessage = message.join('\r\n')
  return Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Quoted-Printable编码
function encodeQuotedPrintable(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, (match) => {
      const hex = match.charCodeAt(0).toString(16).toUpperCase()
      return '=' + (hex.length === 1 ? '0' + hex : hex)
    })
    .replace(/(.{75})/g, '$1=\r\n')
}

// 获取用户邮箱地址
export async function getUserEmail(oauth2Client: OAuth2Client): Promise<string> {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const response = await gmail.users.getProfile({ userId: 'me' })
    
    return response.data.emailAddress || ''
  } catch (error) {
    console.error('Error getting user email:', error)
    throw new Error(`Failed to get user email: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 列出草稿
export async function listDrafts(oauth2Client: OAuth2Client, maxResults: number = 10) {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const response = await gmail.users.drafts.list({
      userId: 'me',
      maxResults
    })
    
    return response.data.drafts || []
  } catch (error) {
    console.error('Error listing drafts:', error)
    throw new Error(`Failed to list drafts: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 删除草稿
export async function deleteDraft(oauth2Client: OAuth2Client, draftId: string): Promise<void> {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    await gmail.users.drafts.delete({
      userId: 'me',
      id: draftId
    })
  } catch (error) {
    console.error('Error deleting draft:', error)
    throw new Error(`Failed to delete draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 发送草稿
export async function sendDraft(oauth2Client: OAuth2Client, draftId: string) {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const response = await gmail.users.drafts.send({
      userId: 'me',
      requestBody: {
        id: draftId
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Error sending draft:', error)
    throw new Error(`Failed to send draft: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 验证Gmail配置
export function validateGmailConfig() {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'GOOGLE_REDIRECT_URI'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Gmail environment variables: ${missingVars.join(', ')}`)
  }
  
  console.log('✅ Gmail configuration validated')
}
