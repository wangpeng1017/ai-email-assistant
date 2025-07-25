'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'

interface LeadDiscoveryFormProps {
  onSubmit: () => void
}

import { LeadDiscoveryResponse, DiscoveredLead } from '@/types'

type DiscoveryResult = LeadDiscoveryResponse

export default function LeadDiscoveryForm({ onSubmit }: LeadDiscoveryFormProps) {
  const { user } = useAuth()
  const { showNotification } = useNotification()

  // 搜索条件
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [keywords, setKeywords] = useState('')
  const [maxResults, setMaxResults] = useState(50)
  const [includeAnalysis, setIncludeAnalysis] = useState(true)

  // 状态管理
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  // 结果显示
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showNotification('error', '错误', '请先登录')
      return
    }

    if (!industry.trim() && !keywords.trim()) {
      showNotification('error', '错误', '请至少输入行业或关键词')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setCurrentStep('初始化线索发现...')

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 500)

      setCurrentStep('分析搜索条件...')

      const response = await fetch('/api/lead-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry,
          location,
          companySize,
          keywords,
          maxResults,
          includeAnalysis,
          userId: user.id
        })
      })

      clearInterval(progressInterval)
      setProgress(100)
      setCurrentStep('处理完成')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: DiscoveryResult = await response.json()

      if (result.success) {
        setDiscoveryResult(result)
        setShowResults(true)
        showNotification(
          'success',
          '线索发现完成',
          `成功发现 ${result.totalDiscovered} 个潜在客户`
        )
        onSubmit()
      } else {
        showNotification(
          'error',
          '发现失败',
          result.errors?.[0] || '线索发现过程中出现错误'
        )
      }
    } catch (error) {
      console.error('线索发现失败:', error)
      showNotification('error', '发现失败', '线索发现过程中出现错误')
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setCurrentStep('')
    }
  }

  // 重置表单
  const resetForm = () => {
    setIndustry('')
    setLocation('')
    setCompanySize('')
    setKeywords('')
    setMaxResults(50)
    setIncludeAnalysis(true)
    setDiscoveryResult(null)
    setShowResults(false)
  }

  // 导出结果
  const exportResults = () => {
    if (!discoveryResult?.discoveredLeads) return

    const csvContent = [
      ['公司名称', '邮箱', '网站', '联系人', '电话', '行业', '地区', '评分', '匹配原因'].join(','),
      ...discoveryResult.discoveredLeads.map(lead => [
        lead.company_name,
        lead.customer_email,
        lead.customer_website,
        lead.contact_person,
        lead.phone,
        lead.industry,
        lead.location,
        lead.scores?.overall || '',
        lead.match_reasons?.join('; ') || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `lead_discovery_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const industries = [
    '科技/互联网',
    '制造业',
    '金融服务',
    '医疗健康',
    '教育培训',
    '零售电商',
    '房地产',
    '咨询服务',
    '媒体广告',
    '其他'
  ]

  const companySizes = [
    '1-10人',
    '11-50人',
    '51-200人',
    '201-500人',
    '501-1000人',
    '1000人以上'
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">智能线索发现</h2>
          <p className="mt-1 text-sm text-gray-600">
            基于行业、地区和关键词智能发现潜在客户
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 进度显示 */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium text-blue-800">{currentStep}</span>
              </div>
              {progress > 0 && (
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {/* 行业选择 */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              目标行业
            </label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">选择行业</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* 地区和公司规模 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                目标地区
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="如：北京、上海、深圳"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-2">
                公司规模
              </label>
              <select
                id="companySize"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">选择规模</option>
                {companySizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 关键词 */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
              关键词
            </label>
            <textarea
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={3}
              placeholder="输入相关关键词，用逗号分隔，如：人工智能,机器学习,数据分析"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 高级设置 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">高级设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-2">
                  最大结果数
                </label>
                <input
                  type="number"
                  id="maxResults"
                  value={maxResults}
                  onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                  min="10"
                  max="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeAnalysis"
                  checked={includeAnalysis}
                  onChange={(e) => setIncludeAnalysis(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includeAnalysis" className="ml-2 block text-sm text-gray-900">
                  包含AI分析
                </label>
              </div>
            </div>
          </div>

          {/* 发现策略 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              发现策略
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-gray-900">智能匹配</span>
                </div>
                <p className="text-sm text-gray-600">
                  基于AI算法智能匹配符合条件的潜在客户
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium text-gray-900">实时更新</span>
                </div>
                <p className="text-sm text-gray-600">
                  持续监控和更新线索信息，确保数据时效性
                </p>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={resetForm}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              重置
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  发现中...
                </div>
              ) : (
                '开始发现'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 发现结果 */}
      {showResults && discoveryResult && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">发现结果</h3>
            <div className="space-x-2">
              <button
                onClick={exportResults}
                className="px-3 py-1 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
              >
                导出CSV
              </button>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {discoveryResult.totalDiscovered || 0}
                </div>
                <div className="text-sm text-blue-700">发现的线索</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {discoveryResult.discoveredLeads?.filter(lead => (lead.scores?.overall || 0) > 0.8).length || 0}
                </div>
                <div className="text-sm text-green-700">高质量线索</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {discoveryResult.jobId ? '已保存' : '未保存'}
                </div>
                <div className="text-sm text-purple-700">保存状态</div>
              </div>
            </div>

            {/* AI分析结果 */}
            {discoveryResult.aiAnalysis && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI分析报告
                </h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {discoveryResult.aiAnalysis.summary}
                </div>
                {discoveryResult.aiAnalysis.fullAnalysis && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                      查看完整分析
                    </summary>
                    <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                      {discoveryResult.aiAnalysis.fullAnalysis}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* 线索列表 */}
            {discoveryResult.discoveredLeads && discoveryResult.discoveredLeads.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">发现的线索 (前10个)</h4>
                <div className="space-y-4">
                  {discoveryResult.discoveredLeads.slice(0, 10).map((lead, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{lead.company_name}</h5>
                        {lead.scores?.overall && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            lead.scores.overall > 0.8 ? 'bg-green-100 text-green-800' :
                            lead.scores.overall > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            评分: {(lead.scores.overall * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                        <div>📧 {lead.customer_email}</div>
                        <div>🌐 {lead.customer_website}</div>
                        <div>🏢 {lead.industry}</div>
                        <div>📍 {lead.location}</div>
                      </div>
                      {lead.match_reasons && lead.match_reasons.length > 0 && (
                        <div className="text-sm text-blue-600">
                          匹配原因: {lead.match_reasons.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 功能说明 */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-green-800">功能说明</h3>
            <ul className="mt-1 text-sm text-green-700 space-y-1">
              <li>• 基于AI技术的智能线索发现和匹配</li>
              <li>• 多维度评分系统：行业匹配、地理位置、公司规模等</li>
              <li>• 集成Gemini AI提供专业的销售策略建议</li>
              <li>• 发现的线索将自动保存到线索管理系统中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
