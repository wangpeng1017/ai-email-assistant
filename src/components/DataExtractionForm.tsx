'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'

interface DataExtractionFormProps {
  onSubmit: () => void
}

export default function DataExtractionForm({ onSubmit }: DataExtractionFormProps) {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [extractionType, setExtractionType] = useState('api')
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [dataSource, setDataSource] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      showNotification('error', '错误', '请先登录')
      return
    }

    if (!dataSource.trim()) {
      showNotification('error', '错误', '请输入数据源')
      return
    }

    setIsProcessing(true)

    try {
      // 这里将来可以实现实际的数据抓取逻辑
      // 目前显示一个占位符消息
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟处理时间
      
      showNotification('success', '数据抓取完成', '数据抓取功能正在开发中，敬请期待')
      onSubmit()
    } catch (error) {
      console.error('数据抓取失败:', error)
      showNotification('error', '抓取失败', '数据抓取过程中出现错误')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">数据抓取</h2>
          <p className="mt-1 text-sm text-gray-600">
            从各种数据源提取客户线索信息
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 抓取类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              抓取类型
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="relative">
                <input
                  type="radio"
                  name="extractionType"
                  value="api"
                  checked={extractionType === 'api'}
                  onChange={(e) => setExtractionType(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  extractionType === 'api' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">API接口</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">通过API接口获取数据</p>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name="extractionType"
                  value="database"
                  checked={extractionType === 'database'}
                  onChange={(e) => setExtractionType(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  extractionType === 'database' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    <span className="font-medium">数据库</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">从数据库导入数据</p>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name="extractionType"
                  value="file"
                  checked={extractionType === 'file'}
                  onChange={(e) => setExtractionType(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  extractionType === 'file' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">文件导入</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">从文件中提取数据</p>
                </div>
              </label>
            </div>
          </div>

          {/* 数据源配置 */}
          <div>
            <label htmlFor="dataSource" className="block text-sm font-medium text-gray-700 mb-2">
              数据源
            </label>
            <input
              type="text"
              id="dataSource"
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              placeholder={
                extractionType === 'api' ? '输入API端点URL' :
                extractionType === 'database' ? '输入数据库连接字符串' :
                '选择文件路径'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* API配置 */}
          {extractionType === 'api' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <input
                  type="url"
                  id="apiUrl"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/leads"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  API密钥
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入API密钥"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

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
                  处理中...
                </div>
              ) : (
                '开始抓取'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 功能说明 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">功能说明</h3>
            <p className="mt-1 text-sm text-blue-700">
              数据抓取功能正在开发中，将支持从API接口、数据库和文件中提取客户线索信息。
              敬请期待后续版本更新。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
