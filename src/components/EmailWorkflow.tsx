'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import SmartAttachmentSelector from './SmartAttachmentSelector'
import EmailPreviewEditor from './EmailPreviewEditor'
import GmailIntegration from './GmailIntegration'
import RealTimeProgress from './RealTimeProgress'

interface Lead {
  id: string
  customer_name: string
  customer_email: string
  customer_website: string
  status: string
  generated_mail_subject?: string
  generated_mail_body?: string
}

interface ProductMaterial {
  id: string
  file_name: string
  file_type: string
  storage_path: string
}

interface GmailDraftResult {
  draftId: string
  messageId: string
  threadId: string
}

interface EmailWorkflowProps {
  lead: Lead
  onComplete?: (result: GmailDraftResult) => void
  className?: string
}

export default function EmailWorkflow({ lead, onComplete, className = '' }: EmailWorkflowProps) {
  const { user, session } = useAuth()
  const [currentStep, setCurrentStep] = useState<'generate' | 'attachments' | 'preview' | 'gmail'>('generate')
  const [emailContent, setEmailContent] = useState<{
    to: string
    subject: string
    body: string
  } | null>(null)
  const [selectedAttachments, setSelectedAttachments] = useState<ProductMaterial[]>([])
  const [gmailTokens, setGmailTokens] = useState<{
    accessToken: string
    refreshToken?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)

  // 生成邮件内容
  const generateEmailContent = useCallback(async () => {
    if (!user || !session) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/automation/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: lead.id,
          generateOnly: true // 只生成内容，不创建草稿
        })
      })

      const data = await response.json()

      if (response.ok) {
        setEmailContent({
          to: lead.customer_email,
          subject: data.emailContent.subject,
          body: data.emailContent.body
        })
        setCurrentStep('attachments')
      } else {
        throw new Error(data.error || 'Failed to generate email content')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user, session, lead.id, lead.customer_email])

  // 处理附件选择完成
  const handleAttachmentsSelected = useCallback((attachments: ProductMaterial[]) => {
    setSelectedAttachments(attachments)
  }, [])

  // 进入预览步骤
  const proceedToPreview = useCallback(() => {
    setCurrentStep('preview')
  }, [])

  // 保存邮件内容
  const handleSaveEmail = useCallback(async (content: { subject: string; body: string }) => {
    if (!user || !session) return

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          generated_mail_subject: content.subject,
          generated_mail_body: content.body
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save email content')
      }

      // 更新本地状态
      setEmailContent(prev => prev ? { ...prev, ...content } : null)
    } catch (error) {
      throw error
    }
  }, [user, session, lead.id])

  // 创建Gmail草稿
  const handleCreateGmailDraft = useCallback(async (content: {
    to: string
    subject: string
    body: string
    attachments: ProductMaterial[]
  }) => {
    if (!user || !session || !gmailTokens) {
      setError('请先连接Gmail账户')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/gmail/create-draft', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: lead.id,
          emailContent: {
            to: content.to,
            subject: content.subject,
            body: content.body,
            attachments: content.attachments
          },
          accessToken: gmailTokens.accessToken,
          refreshToken: gmailTokens.refreshToken
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (onComplete) {
          onComplete({
            draftId: data.draftId,
            messageId: data.messageId,
            threadId: data.threadId
          })
        }
      } else {
        throw new Error(data.error || 'Failed to create Gmail draft')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user, session, gmailTokens, lead.id, onComplete])

  // Gmail认证完成
  const handleGmailAuthComplete = useCallback((tokens: { accessToken: string; refreshToken?: string }) => {
    setGmailTokens(tokens)
  }, [])

  // 获取步骤标题
  const getStepTitle = () => {
    switch (currentStep) {
      case 'generate': return '生成邮件内容'
      case 'attachments': return '选择智能附件'
      case 'preview': return '预览和编辑'
      case 'gmail': return 'Gmail集成'
      default: return ''
    }
  }

  // 获取步骤描述
  const getStepDescription = () => {
    switch (currentStep) {
      case 'generate': return '基于客户信息和AI分析生成个性化邮件内容'
      case 'attachments': return '智能匹配相关的产品资料作为附件'
      case 'preview': return '预览邮件内容并进行最终编辑'
      case 'gmail': return '连接Gmail并创建邮件草稿'
      default: return ''
    }
  }

  // 初始化：如果已有生成的内容，直接进入附件选择
  useEffect(() => {
    if (lead.generated_mail_subject && lead.generated_mail_body) {
      setEmailContent({
        to: lead.customer_email,
        subject: lead.generated_mail_subject,
        body: lead.generated_mail_body
      })
      setCurrentStep('attachments')
    }
  }, [lead.generated_mail_subject, lead.generated_mail_body, lead.customer_email])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 步骤指示器 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h2>
            <p className="text-sm text-gray-500">{getStepDescription()}</p>
          </div>
          
          {/* 步骤进度 */}
          <div className="flex items-center space-x-2">
            {['generate', 'attachments', 'preview', 'gmail'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : index < ['generate', 'attachments', 'preview', 'gmail'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {index < ['generate', 'attachments', 'preview', 'gmail'].indexOf(currentStep) ? '✓' : index + 1}
                </div>
                {index < 3 && (
                  <div className={`
                    w-8 h-0.5 mx-2
                    ${index < ['generate', 'attachments', 'preview', 'gmail'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 客户信息 */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">客户信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">客户名称:</span>
              <span className="ml-2 font-medium">{lead.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-500">邮箱:</span>
              <span className="ml-2 font-medium">{lead.customer_email}</span>
            </div>
            <div>
              <span className="text-gray-500">网站:</span>
              <span className="ml-2 font-medium">{lead.customer_website}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 步骤内容 */}
      {currentStep === 'generate' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">准备生成邮件内容</h3>
          <p className="text-gray-600 mb-6">
            AI将分析客户网站并生成个性化的邮件内容
          </p>
          <button
            onClick={generateEmailContent}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            {loading ? '生成中...' : '开始生成邮件'}
          </button>
        </div>
      )}

      {currentStep === 'attachments' && emailContent && (
        <div className="space-y-6">
          <SmartAttachmentSelector
            emailContent={{
              subject: emailContent.subject,
              body: emailContent.body,
              customerName: lead.customer_name
            }}
            leadId={lead.id}
            onAttachmentsSelected={handleAttachmentsSelected}
          />
          
          <div className="flex justify-end">
            <button
              onClick={proceedToPreview}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              继续预览邮件
            </button>
          </div>
        </div>
      )}

      {currentStep === 'preview' && emailContent && (
        <div className="space-y-6">
          <EmailPreviewEditor
            initialContent={emailContent}
            attachments={selectedAttachments}
            leadId={lead.id}
            onSave={handleSaveEmail}
            onSendDraft={handleCreateGmailDraft}
          />
          
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('attachments')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              返回附件选择
            </button>
            
            <button
              onClick={() => setCurrentStep('gmail')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              连接Gmail
            </button>
          </div>
        </div>
      )}

      {currentStep === 'gmail' && (
        <div className="space-y-6">
          <GmailIntegration onAuthComplete={handleGmailAuthComplete} />
          
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('preview')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              返回预览
            </button>
            
            {gmailTokens && emailContent && (
              <button
                onClick={() => handleCreateGmailDraft({
                  ...emailContent,
                  attachments: selectedAttachments
                })}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? '创建中...' : '创建Gmail草稿'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 实时进度显示 */}
      {batchId && (
        <RealTimeProgress
          batchId={batchId}
          onComplete={(results) => {
            setBatchId(null)
            // 转换BatchResults为GmailDraftResult格式
            if (onComplete && results.results && results.results.length > 0) {
              onComplete({
                draftId: 'batch-completed',
                messageId: 'batch-completed',
                threadId: 'batch-completed'
              })
            }
          }}
          onError={(error) => {
            setBatchId(null)
            setError(error)
          }}
        />
      )}
    </div>
  )
}
