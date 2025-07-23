'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'

interface ScrapedLead {
  company_name: string
  website_url: string
  email?: string
  description?: string
}

interface WebScrapingFormProps {
  onClose?: () => void // 可选，暂未使用
  onSubmit: () => void
}

export default function WebScrapingForm({ onSubmit }: WebScrapingFormProps) {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [targetUrl, setTargetUrl] = useState('')
  const [crawlDepth, setCrawlDepth] = useState('1')
  const [maxResults, setMaxResults] = useState('50')
  const [isProcessing, setIsProcessing] = useState(false)
  const [scrapedLeads, setScrapedLeads] = useState<ScrapedLead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set())

  // URL验证
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // 开始爬取
  const handleStartScraping = async () => {
    if (!targetUrl.trim()) {
      showNotification('error', '输入错误', '请输入要爬取的网站URL')
      return
    }

    if (!isValidUrl(targetUrl)) {
      showNotification('error', '格式错误', '请输入有效的网站URL')
      return
    }

    if (!user) {
      showNotification('error', '认证错误', '请先登录')
      return
    }

    setIsProcessing(true)
    setScrapedLeads([])

    try {
      const response = await fetch('/api/scraping/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          crawlDepth: parseInt(crawlDepth),
          maxResults: parseInt(maxResults),
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '爬取失败')
      }

      if (data.leads && data.leads.length > 0) {
        setScrapedLeads(data.leads)
        // 默认选中所有爬取到的线索
        setSelectedLeads(new Set(data.leads.map((_: ScrapedLead, index: number) => index)))
        showNotification('success', '爬取成功', `成功爬取到 ${data.leads.length} 条客户线索`)
      } else {
        showNotification('warning', '爬取完成', '未找到有效的客户线索，请检查目标网站')
      }
    } catch (error) {
      console.error('爬取失败:', error)
      showNotification('error', '爬取失败', error instanceof Error ? error.message : '网页爬取过程中出现错误')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 爬取设置 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">智能网页爬取</h3>
          <p className="text-sm text-gray-600">
            自动从目标网站爬取客户联系信息，快速建立客户线索库
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="target-url" className="block text-sm font-medium text-gray-700 mb-2">
              目标网站URL
            </label>
            <input
              type="url"
              id="target-url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com/companies"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isProcessing}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="crawl-depth" className="block text-sm font-medium text-gray-700 mb-2">
                爬取深度
              </label>
              <select
                id="crawl-depth"
                value={crawlDepth}
                onChange={(e) => setCrawlDepth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isProcessing}
              >
                <option value="1">1层（仅首页）</option>
                <option value="2">2层（首页+子页面）</option>
                <option value="3">3层（深度爬取）</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="max-results" className="block text-sm font-medium text-gray-700 mb-2">
                最大结果数
              </label>
              <select
                id="max-results"
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isProcessing}
              >
                <option value="10">10条</option>
                <option value="25">25条</option>
                <option value="50">50条</option>
                <option value="100">100条</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartScraping}
            disabled={isProcessing || !targetUrl.trim()}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                爬取中...
              </div>
            ) : (
              '开始爬取'
            )}
          </button>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-purple-900 mb-2">使用说明</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• 输入包含公司列表的网页URL（如行业目录、公司列表页面）</li>
          <li>• 选择合适的爬取深度和最大结果数</li>
          <li>• 系统将自动识别并提取页面中的公司名称和网站链接</li>
          <li>• 选择需要的线索后点击保存，系统将自动添加到客户线索列表</li>
        </ul>
      </div>
    </div>
  )
}
