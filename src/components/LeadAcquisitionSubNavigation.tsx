'use client'

interface LeadAcquisitionSubNavigationProps {
  onSubMenuChange: (subMenu: string) => void
  activeSubMenu: string
}

export default function LeadAcquisitionSubNavigation({ onSubMenuChange, activeSubMenu }: LeadAcquisitionSubNavigationProps) {
  const subMenuItems = [
    {
      id: 'web-scraping',
      name: '网页爬取',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
        </svg>
      ),
      description: '从网站自动爬取客户信息'
    },
    {
      id: 'data-extraction',
      name: '数据抓取',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      description: '从各种数据源提取线索信息'
    },
    {
      id: 'lead-discovery',
      name: '线索发现',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      description: '智能发现和识别潜在客户'
    }
  ]

  return (
    <div className="bg-gray-50 border-b border-gray-200 md:ml-64">
      <div className="px-6 py-3">
        <div className="flex flex-wrap gap-2 md:flex-nowrap md:space-x-4">
          {subMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSubMenuChange(item.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeSubMenu === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                {item.icon}
                <span>{item.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
