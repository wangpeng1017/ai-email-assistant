'use client'

interface LeadsSubNavigationProps {
  onSubMenuChange: (subMenu: string) => void
  activeSubMenu: string
}

export default function LeadsSubNavigation({ onSubMenuChange, activeSubMenu }: LeadsSubNavigationProps) {
  const subMenuItems = [
    {
      id: 'management',
      name: '客户线索管理',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      description: '查看、编辑和管理所有客户线索'
    },
    {
      id: 'scraping',
      name: '网页爬取',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
        </svg>
      ),
      description: '从网站自动爬取客户信息'
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
