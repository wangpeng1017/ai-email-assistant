'use client'

interface LeadsSubNavigationProps {
  onSubMenuChange: (subMenu: string) => void
  activeSubMenu: string
}

export default function LeadsSubNavigation({ onSubMenuChange, activeSubMenu }: LeadsSubNavigationProps) {
  const subMenuItems = [
    {
      id: 'management',
      name: '线索管理',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      description: '查看、编辑和管理所有客户线索'
    },
    {
      id: 'import',
      name: '批量导入',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      description: '批量导入Excel或CSV文件'
    },
    {
      id: 'manual',
      name: '手动添加',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      description: '手动添加单个客户线索'
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
