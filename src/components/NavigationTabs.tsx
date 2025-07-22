'use client'

interface NavigationTabsProps {
  onTabChange: (tab: string) => void
  activeTab: string
}

export default function NavigationTabs({ onTabChange, activeTab }: NavigationTabsProps) {
  const tabs = [
    {
      id: 'manual',
      name: '手动输入',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      description: '手动输入单个客户信息'
    },
    {
      id: 'batch',
      name: '批量导入',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      description: '上传Excel文件批量处理'
    },
    {
      id: 'scraping',
      name: '网页爬取',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
        </svg>
      ),
      description: '自动从网站爬取客户信息'
    }
  ]

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-center text-sm font-medium hover:bg-gray-50 focus:z-10 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className={`${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {tab.icon}
                </span>
                <span className="font-medium">{tab.name}</span>
              </div>
              <p className={`mt-1 text-xs ${
                activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'
              }`}>
                {tab.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
