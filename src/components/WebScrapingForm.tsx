'use client'

interface WebScrapingFormProps {
  onClose: () => void
  onSubmit: () => void
}

export default function WebScrapingForm({ onClose }: WebScrapingFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
          <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">智能网页爬取</h3>
        <p className="text-sm text-gray-600 mb-6">
          自动从目标网站爬取客户联系信息，快速建立客户线索库
        </p>
        
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="target-url" className="block text-sm font-medium text-gray-700 mb-2">
              目标网站URL
            </label>
            <input
              type="url"
              id="target-url"
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="crawl-depth" className="block text-sm font-medium text-gray-700 mb-2">
              爬取深度
            </label>
            <select
              id="crawl-depth"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="10">10个联系人</option>
              <option value="25">25个联系人</option>
              <option value="50">50个联系人</option>
              <option value="100">100个联系人</option>
            </select>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-purple-700">
                <strong>智能识别：</strong>
                <br />
                自动识别联系人姓名、邮箱地址、公司信息等关键数据
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>功能开发中：</strong> 网页爬取功能将在下个版本中提供
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            返回
          </button>
          <button
            type="button"
            disabled
            className="px-4 py-2 text-sm font-medium text-white bg-gray-400 border border-transparent rounded-md cursor-not-allowed"
          >
            开始爬取（开发中）
          </button>
        </div>
      </div>
    </div>
  )
}
