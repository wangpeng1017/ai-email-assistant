'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import { DataExtractionConfig, DataExtractionResult } from '@/types'

interface DataExtractionFormProps {
  onSubmit: () => void
}

export default function DataExtractionForm({ onSubmit }: DataExtractionFormProps) {
  const { user } = useAuth()
  const { showNotification } = useNotification()

  // 基本配置
  const [extractionType, setExtractionType] = useState<'api' | 'database' | 'file'>('api')
  const [dataSource, setDataSource] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  // API配置
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [authType, setAuthType] = useState<'api-key' | 'bearer' | 'oauth2' | 'basic'>('api-key')
  const [method, setMethod] = useState<'GET' | 'POST'>('GET')
  const [headers, setHeaders] = useState('')
  const [requestBody, setRequestBody] = useState('')

  // 数据库配置
  const [databaseType, setDatabaseType] = useState<'mysql' | 'postgresql' | 'mongodb'>('mysql')
  const [connectionString, setConnectionString] = useState('')
  const [query, setQuery] = useState('')

  // 高级配置
  const [batchSize, setBatchSize] = useState(100)
  const [maxRecords, setMaxRecords] = useState(1000)
  const [retryAttempts, setRetryAttempts] = useState(3)

  // 结果预览
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [extractionResult, setExtractionResult] = useState<DataExtractionResult | null>(null)

  // 测试连接
  const testConnection = async () => {
    if (!user) {
      showNotification('error', '错误', '请先登录')
      return
    }

    const config = buildExtractionConfig()
    if (!validateConfig(config)) return

    setIsProcessing(true)
    setCurrentStep('测试连接...')

    try {
      const response = await fetch('/api/data-extraction/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, userId: user.id })
      })

      const result = await response.json()

      if (result.success) {
        showNotification('success', '连接成功', '数据源连接测试通过')
      } else {
        showNotification('error', '连接失败', result.error || '无法连接到数据源')
      }
    } catch (error) {
      showNotification('error', '连接失败', '测试连接时出现错误')
    } finally {
      setIsProcessing(false)
      setCurrentStep('')
    }
  }

  // 预览数据
  const previewDataSource = async () => {
    if (!user) {
      showNotification('error', '错误', '请先登录')
      return
    }

    const config = buildExtractionConfig()
    if (!validateConfig(config)) return

    setIsProcessing(true)
    setCurrentStep('获取数据预览...')

    try {
      const response = await fetch('/api/data-extraction/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, userId: user.id, maxRecords: 10 })
      })

      const result = await response.json()

      if (result.success && result.data) {
        setPreviewData(result.data)
        setShowPreview(true)
        showNotification('success', '预览成功', `获取到 ${result.data.length} 条预览数据`)
      } else {
        showNotification('error', '预览失败', result.error || '无法获取预览数据')
      }
    } catch (error) {
      showNotification('error', '预览失败', '获取预览数据时出现错误')
    } finally {
      setIsProcessing(false)
      setCurrentStep('')
    }
  }

  // 构建抓取配置
  const buildExtractionConfig = (): DataExtractionConfig => {
    const config: DataExtractionConfig = {
      extractionType,
      dataSource,
      batchSize,
      maxRecords,
      retryAttempts
    }

    if (extractionType === 'api') {
      config.apiUrl = apiUrl
      config.apiKey = apiKey
      config.authType = authType
      config.method = method
      config.timeout = 30000

      if (headers.trim()) {
        try {
          config.headers = JSON.parse(headers) as Record<string, string>
        } catch {
          config.headers = {}
        }
      }

      if (requestBody.trim()) {
        config.requestBody = requestBody
      }
    } else if (extractionType === 'database') {
      config.databaseType = databaseType
      config.connectionString = connectionString
      config.query = query
    }

    return config
  }

  // 验证配置
  const validateConfig = (config: DataExtractionConfig): boolean => {
    if (!config.dataSource.trim()) {
      showNotification('error', '错误', '请输入数据源')
      return false
    }

    if (config.extractionType === 'api') {
      if (!config.apiUrl?.trim()) {
        showNotification('error', '错误', '请输入API URL')
        return false
      }
      try {
        new URL(config.apiUrl)
      } catch {
        showNotification('error', '错误', '请输入有效的API URL')
        return false
      }
    } else if (config.extractionType === 'database') {
      if (!config.connectionString?.trim()) {
        showNotification('error', '错误', '请输入数据库连接字符串')
        return false
      }
      if (!config.query?.trim()) {
        showNotification('error', '错误', '请输入查询语句')
        return false
      }
    }

    return true
  }

  // 主要提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showNotification('error', '错误', '请先登录')
      return
    }

    const config = buildExtractionConfig()
    if (!validateConfig(config)) return

    setIsProcessing(true)
    setProgress(0)
    setCurrentStep('开始数据抓取...')

    try {
      const response = await fetch('/api/data-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, userId: user.id })
      })

      const result: DataExtractionResult = await response.json()

      if (result.success) {
        setExtractionResult(result)
        showNotification(
          'success',
          '数据抓取完成',
          `成功抓取 ${result.processedRecords} 条记录`
        )
        onSubmit()
      } else {
        showNotification(
          'error',
          '抓取失败',
          result.errors?.[0] || '数据抓取过程中出现错误'
        )
      }
    } catch (error) {
      console.error('数据抓取失败:', error)
      showNotification('error', '抓取失败', '数据抓取过程中出现错误')
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setCurrentStep('')
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
                  onChange={(e) => setExtractionType(e.target.value as 'api')}
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
                  onChange={(e) => setExtractionType(e.target.value as 'database')}
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
                  onChange={(e) => setExtractionType(e.target.value as 'file')}
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
              数据源描述
            </label>
            <input
              type="text"
              id="dataSource"
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              placeholder="为此数据源输入描述性名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* API配置 */}
          {extractionType === 'api' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    API URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="apiUrl"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.example.com/leads"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-2">
                    请求方法
                  </label>
                  <select
                    id="method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="authType" className="block text-sm font-medium text-gray-700 mb-2">
                    认证类型
                  </label>
                  <select
                    id="authType"
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value as 'api-key' | 'bearer' | 'oauth2' | 'basic')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="api-key">API Key</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="oauth2">OAuth 2.0</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                    {authType === 'api-key' ? 'API密钥' :
                     authType === 'bearer' ? 'Bearer Token' :
                     authType === 'oauth2' ? 'OAuth Token' : '认证信息'}
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入认证信息"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="headers" className="block text-sm font-medium text-gray-700 mb-2">
                  自定义请求头 (JSON格式)
                </label>
                <textarea
                  id="headers"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  rows={3}
                  placeholder='{"Content-Type": "application/json", "User-Agent": "MyApp/1.0"}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {method === 'POST' && (
                <div>
                  <label htmlFor="requestBody" className="block text-sm font-medium text-gray-700 mb-2">
                    请求体 (JSON格式)
                  </label>
                  <textarea
                    id="requestBody"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    rows={4}
                    placeholder='{"query": "SELECT * FROM leads", "limit": 100}'
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* 数据库配置 */}
          {extractionType === 'database' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="databaseType" className="block text-sm font-medium text-gray-700 mb-2">
                  数据库类型
                </label>
                <select
                  id="databaseType"
                  value={databaseType}
                  onChange={(e) => setDatabaseType(e.target.value as 'mysql' | 'postgresql' | 'mongodb')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>

              <div>
                <label htmlFor="connectionString" className="block text-sm font-medium text-gray-700 mb-2">
                  连接字符串 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="connectionString"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder={
                    databaseType === 'mysql' ? 'mysql://user:password@host:port/database' :
                    databaseType === 'postgresql' ? 'postgresql://user:password@host:port/database' :
                    'mongodb://user:password@host:port/database'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  查询语句 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={4}
                  placeholder={
                    databaseType === 'mongodb'
                      ? '{"collection": "companies", "filter": {"industry": "tech"}}'
                      : 'SELECT company_name, email, website FROM companies WHERE industry = "tech"'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* 高级设置 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">高级设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="batchSize" className="block text-sm font-medium text-gray-700 mb-2">
                  批处理大小
                </label>
                <input
                  type="number"
                  id="batchSize"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                  min="10"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="maxRecords" className="block text-sm font-medium text-gray-700 mb-2">
                  最大记录数
                </label>
                <input
                  type="number"
                  id="maxRecords"
                  value={maxRecords}
                  onChange={(e) => setMaxRecords(parseInt(e.target.value) || 1000)}
                  min="1"
                  max="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="retryAttempts" className="block text-sm font-medium text-gray-700 mb-2">
                  重试次数
                </label>
                <input
                  type="number"
                  id="retryAttempts"
                  value={retryAttempts}
                  onChange={(e) => setRetryAttempts(parseInt(e.target.value) || 3)}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between">
            <div className="space-x-3">
              <button
                type="button"
                onClick={testConnection}
                disabled={isProcessing}
                className="px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                测试连接
              </button>
              <button
                type="button"
                onClick={previewDataSource}
                disabled={isProcessing}
                className="px-4 py-2 text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                预览数据
              </button>
            </div>
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

      {/* 数据预览 */}
      {showPreview && previewData.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">数据预览</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData[0] && Object.keys(previewData[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {String(value).length > 50
                            ? String(value).substring(0, 50) + '...'
                            : String(value)
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              显示前 {previewData.length} 条记录的预览
            </p>
          </div>
        </div>
      )}

      {/* 抓取结果 */}
      {extractionResult && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">抓取结果</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {extractionResult.totalRecords || 0}
                </div>
                <div className="text-sm text-green-700">总记录数</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {extractionResult.processedRecords || 0}
                </div>
                <div className="text-sm text-blue-700">已处理记录</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {extractionResult.metadata?.extractionTime || 0}ms
                </div>
                <div className="text-sm text-purple-700">处理时间</div>
              </div>
            </div>

            {extractionResult.errors && extractionResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">错误信息</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {extractionResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {extractionResult.warnings && extractionResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">警告信息</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {extractionResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {extractionResult.jobId && (
              <div className="text-sm text-gray-600">
                任务ID: {extractionResult.jobId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 功能说明 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">使用说明</h3>
            <ul className="mt-1 text-sm text-blue-700 space-y-1">
              <li>• API抓取：支持RESTful API，包含认证和重试机制</li>
              <li>• 数据库抓取：支持MySQL、PostgreSQL、MongoDB连接</li>
              <li>• 建议先测试连接，再预览数据，最后执行完整抓取</li>
              <li>• 抓取的数据将自动转换为线索格式并保存到系统中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
