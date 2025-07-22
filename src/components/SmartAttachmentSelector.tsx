'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ProductMaterial {
  id: string
  file_name: string
  file_type: string
  storage_path: string
  description?: string
  created_at: string
}

interface AttachmentMatch {
  material: ProductMaterial
  relevanceScore: number
  matchReasons: string[]
  confidence: 'high' | 'medium' | 'low'
}

interface AttachmentRecommendation {
  matches: AttachmentMatch[]
  totalMaterials: number
  processingTime: number
  summary: string
}

interface SmartAttachmentSelectorProps {
  emailContent: {
    subject: string
    body: string
    customerName?: string
  }
  leadId: string
  onAttachmentsSelected: (attachments: ProductMaterial[]) => void
  className?: string
}

export default function SmartAttachmentSelector({
  emailContent,
  leadId,
  onAttachmentsSelected,
  className = ''
}: SmartAttachmentSelectorProps) {
  const { user } = useAuth()
  const [recommendation, setRecommendation] = useState<AttachmentRecommendation | null>(null)
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // 获取智能推荐
  const fetchRecommendations = async () => {
    if (!user || !emailContent.subject || !emailContent.body) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/attachments/match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailContent,
          leadId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setRecommendation(data.recommendation)
        
        // 自动选择高置信度的附件
        const highConfidenceIds = data.recommendation.matches
          .filter((match: AttachmentMatch) => match.confidence === 'high')
          .map((match: AttachmentMatch) => match.material.id)
        
        setSelectedAttachments(new Set(highConfidenceIds))
      } else {
        throw new Error(data.error || 'Failed to get recommendations')
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // 切换附件选择
  const toggleAttachment = (materialId: string) => {
    const newSelected = new Set(selectedAttachments)
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId)
    } else {
      newSelected.add(materialId)
    }
    setSelectedAttachments(newSelected)
  }

  // 获取选中的附件
  const getSelectedMaterials = (): ProductMaterial[] => {
    if (!recommendation) return []
    
    return recommendation.matches
      .filter(match => selectedAttachments.has(match.material.id))
      .map(match => match.material)
  }

  // 获取置信度颜色
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // 获取置信度文本
  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high': return '高相关'
      case 'medium': return '中等相关'
      case 'low': return '低相关'
      default: return '未知'
    }
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
    fetchRecommendations()
  }, [emailContent, leadId, user])

  useEffect(() => {
    onAttachmentsSelected(getSelectedMaterials())
  }, [selectedAttachments, recommendation])

  const displayedMatches = showAll ? recommendation?.matches || [] : (recommendation?.matches || []).slice(0, 5)

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">智能附件推荐</h3>
            <p className="text-sm text-gray-500">基于邮件内容智能匹配相关产品资料</p>
          </div>
        </div>
        
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {loading ? '分析中...' : '重新分析'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">正在分析邮件内容和产品资料...</span>
        </div>
      )}

      {recommendation && !loading && (
        <>
          {/* 推荐摘要 */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 mt-1">🤖</div>
              <div>
                <p className="text-sm text-blue-800 font-medium">智能分析结果</p>
                <p className="text-sm text-blue-700 mt-1">{recommendation.summary}</p>
                <p className="text-xs text-blue-600 mt-2">
                  分析了 {recommendation.totalMaterials} 个产品资料，耗时 {recommendation.processingTime}ms
                </p>
              </div>
            </div>
          </div>

          {/* 附件列表 */}
          {recommendation.matches.length > 0 ? (
            <>
              <div className="space-y-3">
                {displayedMatches.map((match) => (
                  <div
                    key={match.material.id}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${selectedAttachments.has(match.material.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => toggleAttachment(match.material.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedAttachments.has(match.material.id)}
                          onChange={() => toggleAttachment(match.material.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getFileTypeIcon(match.material.file_type)}</span>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {match.material.file_name}
                          </h4>
                          <span className={`
                            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${getConfidenceColor(match.confidence)}
                          `}>
                            {getConfidenceText(match.confidence)}
                          </span>
                        </div>
                        
                        {match.material.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {match.material.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {match.matchReasons.map((reason, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            相关性: {match.relevanceScore.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 显示更多按钮 */}
              {recommendation.matches.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {showAll ? '收起' : `显示全部 ${recommendation.matches.length} 个推荐`}
                  </button>
                </div>
              )}

              {/* 选择摘要 */}
              {selectedAttachments.size > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    已选择 {selectedAttachments.size} 个附件，将添加到邮件中
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📎</div>
              <p className="text-gray-600">未找到相关的产品资料</p>
              <p className="text-sm text-gray-500 mt-1">
                尝试上传更多产品资料或调整邮件内容
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
