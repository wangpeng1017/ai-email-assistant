'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'

interface LeadDiscoveryFormProps {
  onSubmit: () => void
}

export default function LeadDiscoveryForm({ onSubmit }: LeadDiscoveryFormProps) {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [keywords, setKeywords] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

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

    try {
      // 这里将来可以实现实际的线索发现逻辑
      // 目前显示一个占位符消息
      await new Promise(resolve => setTimeout(resolve, 3000)) // 模拟处理时间
      
      showNotification('success', '线索发现完成', '线索发现功能正在开发中，敬请期待')
      onSubmit()
    } catch (error) {
      console.error('线索发现失败:', error)
      showNotification('error', '发现失败', '线索发现过程中出现错误')
    } finally {
      setIsProcessing(false)
    }
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

          {/* 提交按钮 */}
          <div className="flex justify-end">
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

      {/* 功能说明 */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-green-800">功能说明</h3>
            <p className="mt-1 text-sm text-green-700">
              智能线索发现功能将结合AI技术和大数据分析，帮助您快速找到符合条件的潜在客户。
              该功能正在开发中，敬请期待。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
