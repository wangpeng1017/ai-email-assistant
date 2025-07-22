'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ProductMaterial {
  id: string
  file_name: string
  file_type: string
  storage_path: string
}

interface EmailPreviewEditorProps {
  initialContent: {
    to: string
    subject: string
    body: string
  }
  attachments: ProductMaterial[]
  leadId: string
  onSave?: (content: { subject: string; body: string }) => void
  onSendDraft?: (content: { to: string; subject: string; body: string; attachments: ProductMaterial[] }) => void
  className?: string
}

export default function EmailPreviewEditor({
  initialContent,
  attachments,
  leadId,
  onSave,
  onSendDraft,
  className = ''
}: EmailPreviewEditorProps) {
  const { user } = useAuth()
  const [content, setContent] = useState(initialContent)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 更新内容
  const updateContent = (field: 'subject' | 'body', value: string) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }

  // 保存邮件内容
  const handleSave = async () => {
    if (!onSave) return

    setLoading(true)
    setError(null)

    try {
      await onSave({ subject: content.subject, body: content.body })
      setSuccess('邮件内容已保存')
      setIsEditing(false)
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 创建Gmail草稿
  const handleCreateDraft = async () => {
    if (!onSendDraft) return

    setLoading(true)
    setError(null)

    try {
      await onSendDraft({
        to: content.to,
        subject: content.subject,
        body: content.body,
        attachments
      })
      setSuccess('Gmail草稿已创建')
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : '创建草稿失败')
    } finally {
      setLoading(false)
    }
  }

  // 重置内容
  const handleReset = () => {
    setContent(initialContent)
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  // 获取文件大小显示
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取文件类型图标
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎥'
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊'
    if (fileType.includes('document') || fileType.includes('word')) return '📝'
    return '📎'
  }

  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">邮件预览与编辑</h3>
            <p className="text-sm text-gray-500">预览和编辑AI生成的邮件内容</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              编辑邮件
            </button>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                重置
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 状态消息 */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* 邮件内容 */}
      <div className="p-6">
        {/* 收件人 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">收件人</label>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-900">{content.to}</p>
          </div>
        </div>

        {/* 主题 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">邮件主题</label>
          {isEditing ? (
            <input
              type="text"
              value={content.subject}
              onChange={(e) => updateContent('subject', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入邮件主题"
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-sm text-gray-900">{content.subject}</p>
            </div>
          )}
        </div>

        {/* 邮件正文 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">邮件正文</label>
          {isEditing ? (
            <textarea
              value={content.body}
              onChange={(e) => updateContent('body', e.target.value)}
              rows={12}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              placeholder="请输入邮件正文"
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div 
                className="text-sm text-gray-900 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: content.body.replace(/\n/g, '<br>') }}
              />
            </div>
          )}
        </div>

        {/* 附件列表 */}
        {attachments.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              附件 ({attachments.length})
            </label>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md"
                >
                  <span className="text-lg">{getFileTypeIcon(attachment.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attachment.file_type}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      已选择
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {attachments.length > 0 && (
              <span>包含 {attachments.length} 个附件</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCreateDraft}
              disabled={loading || !content.subject || !content.body}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v.273L12 8.91l6.545-4.816v-.273h3.819c.904 0 1.636.732 1.636 1.636z"/>
              </svg>
              <span>{loading ? '创建中...' : '创建Gmail草稿'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 邮件统计信息 */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>字符数: {content.body.length}</span>
            <span>行数: {content.body.split('\n').length}</span>
            {attachments.length > 0 && (
              <span>附件: {attachments.length} 个</span>
            )}
          </div>
          <div>
            最后编辑: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
