'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '@/stores/appStore'
import { useDebounce } from '@/hooks/useDebounce'

const LeadsFilters: React.FC = () => {
  const filters = useAppStore((state) => state.filters.leads)
  const setFilter = useAppStore((state) => state.setFilter)
  const clearFilters = useAppStore((state) => state.clearFilters)
  
  // 本地搜索状态（用于防抖）
  const [localSearch, setLocalSearch] = useState(filters.search)
  
  // 防抖搜索
  const debouncedSearch = useDebounce(localSearch, 300)
  
  // 当防抖值变化时更新store
  React.useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilter('leads', 'search', debouncedSearch)
    }
  }, [debouncedSearch, filters.search, setFilter])

  // 状态选项
  const statusOptions = useMemo(() => [
    { value: 'all', label: '全部状态', count: null },
    { value: 'pending', label: '待处理', count: 45 },
    { value: 'processing', label: '处理中', count: 23 },
    { value: 'completed', label: '已完成', count: 156 },
    { value: 'failed', label: '失败', count: 8 }
  ], [])

  // 来源选项
  const sourceOptions = useMemo(() => [
    { value: 'all', label: '全部来源', count: null },
    { value: 'website', label: '官网', count: 89 },
    { value: 'social_media', label: '社交媒体', count: 67 },
    { value: 'email_campaign', label: '邮件营销', count: 45 },
    { value: 'referral', label: '推荐', count: 34 },
    { value: 'advertisement', label: '广告', count: 28 },
    { value: 'other', label: '其他', count: 12 }
  ], [])

  // 处理过滤器变化
  const handleStatusChange = useCallback((value: string) => {
    setFilter('leads', 'status', value)
  }, [setFilter])

  const handleSourceChange = useCallback((value: string) => {
    setFilter('leads', 'source', value)
  }, [setFilter])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value)
  }, [])

  // 清除所有过滤器
  const handleClearFilters = useCallback(() => {
    setLocalSearch('')
    clearFilters('leads')
  }, [clearFilters])

  // 检查是否有活动的过滤器
  const hasActiveFilters = useMemo(() => {
    return filters.status !== 'all' || 
           filters.source !== 'all' || 
           filters.search.length > 0
  }, [filters])

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* 左侧：搜索和过滤器 */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="搜索客户名称、邮箱..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* 状态过滤器 */}
          <div className="w-full sm:w-48">
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.count !== null && ` (${option.count})`}
                </option>
              ))}
            </select>
          </div>

          {/* 来源过滤器 */}
          <div className="w-full sm:w-48">
            <select
              value={filters.source}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.count !== null && ` (${option.count})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center space-x-3">
          {/* 活动过滤器指示器 */}
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <FunnelIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  {[
                    filters.status !== 'all' && '状态',
                    filters.source !== 'all' && '来源',
                    filters.search && '搜索'
                  ].filter(Boolean).join(', ')}
                </span>
              </div>
              
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                清除
              </button>
            </div>
          )}

          {/* 高级过滤器按钮 */}
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <FunnelIcon className="h-4 w-4 mr-2" />
            高级过滤
          </button>
        </div>
      </div>

      {/* 快速过滤标签 */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              状态: {statusOptions.find(opt => opt.value === filters.status)?.label}
              <button
                onClick={() => handleStatusChange('all')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.source !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              来源: {sourceOptions.find(opt => opt.value === filters.source)?.label}
              <button
                onClick={() => handleSourceChange('all')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.search && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              搜索: &ldquo;{filters.search}&rdquo;
              <button
                onClick={() => setLocalSearch('')}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(LeadsFilters)
