'use client'

import React from 'react'
import { useAppStore } from '@/stores/appStore'
import { useDebounce } from '@/hooks/useDebounce'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

const MaterialsFilters: React.FC = () => {
  const filters = useAppStore((state) => state.filters.materials)
  const setFilter = useAppStore((state) => state.setFilter)
  
  const [searchInput, setSearchInput] = React.useState(filters.search)
  const debouncedSearch = useDebounce(searchInput, 300)

  // 当防抖搜索值变化时更新过滤器
  React.useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilter('materials', 'search', debouncedSearch)
    }
  }, [debouncedSearch, filters.search, setFilter])

  const handleFilterChange = (key: string, value: string) => {
    setFilter('materials', key, value)
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 搜索框 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            搜索文件
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索文件名、描述..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* 文件类型过滤 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文件类型
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">所有类型</option>
            <option value="pdf">PDF文档</option>
            <option value="image">图片文件</option>
            <option value="video">视频文件</option>
            <option value="document">文档文件</option>
            <option value="other">其他类型</option>
          </select>
        </div>

        {/* 操作按钮 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            操作
          </label>
          <button
            onClick={() => {
              // TODO: 实现高级过滤
            }}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            高级过滤
          </button>
        </div>
      </div>

      {/* 活动过滤器显示 */}
      {(filters.search || filters.type !== 'all') && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              搜索: {filters.search}
              <button
                onClick={() => {
                  setSearchInput('')
                  setFilter('materials', 'search', '')
                }}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.type !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              类型: {filters.type}
              <button
                onClick={() => handleFilterChange('type', 'all')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
              >
                ×
              </button>
            </span>
          )}
          
          <button
            onClick={() => {
              setSearchInput('')
              setFilter('materials', 'search', '')
              setFilter('materials', 'type', 'all')
            }}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            清除所有过滤器
          </button>
        </div>
      )}
    </div>
  )
}

export default React.memo(MaterialsFilters)
