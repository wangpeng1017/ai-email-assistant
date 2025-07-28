'use client'

import React, { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLeadsManagement } from '@/hooks/useLeadsQuery'
import { useAppStore } from '@/stores/appStore'
import { LeadsPageSkeleton } from '@/components/skeletons/LeadsSkeleton'
import LeadsHeader from './LeadsHeader'
import LeadsFilters from './LeadsFilters'
import LeadsTable from './LeadsTable'
import LeadsPagination from './LeadsPagination'
import ErrorBoundary from '@/components/ErrorBoundary'

// 主容器组件 - 负责数据获取和状态管理
const LeadsContainer: React.FC = () => {
  const { user } = useAuth()
  const activeMenu = useAppStore((state) => state.activeMenu)
  
  // 如果用户未登录或当前不在线索页面，不渲染
  if (!user || activeMenu !== 'leads') {
    return null
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LeadsPageSkeleton />}>
        <LeadsContent userId={user.id} />
      </Suspense>
    </ErrorBoundary>
  )
}

// 内容组件 - 使用数据获取hooks
const LeadsContent: React.FC<{ userId: string }> = ({ userId }) => {
  const {
    leads,
    isLoading,
    error,
    addLead,
    updateLead,
    deleteLead,
    importLeads,
    isAdding,
    isUpdating,
    isDeleting,
    isImporting,
    refetch
  } = useLeadsManagement(userId)

  // 如果正在加载，显示骨架屏
  if (isLoading) {
    return <LeadsPageSkeleton />
  }

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-sm text-gray-600 mb-4">
              无法加载客户线索数据，请检查网络连接或稍后重试。
            </p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <LeadsHeader
        onAddLead={addLead}
        onImportLeads={importLeads}
        isAdding={isAdding}
        isImporting={isImporting}
      />

      {/* 过滤器和搜索 */}
      <LeadsFilters />

      {/* 数据表格 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <LeadsTable
          leads={leads}
          onUpdateLead={updateLead}
          onDeleteLead={deleteLead}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
        
        <LeadsPagination />
      </div>
    </div>
  )
}

export default LeadsContainer

// 用于懒加载的组件
export const LazyLeadsContainer = React.lazy(() => import('./LeadsContainer'))

// 带有错误边界的包装器
export const LeadsContainerWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">页面加载失败</h3>
              <p className="text-sm text-gray-600 mb-4">
                客户线索页面遇到了技术问题，请尝试刷新页面。
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      }
    >
      <LeadsContainer />
    </ErrorBoundary>
  )
}

// 性能优化的记忆化组件
export const MemoizedLeadsContainer = React.memo(LeadsContainer)

// 预加载数据的组件
export const PreloadedLeadsContainer: React.FC<{ userId: string }> = ({ userId }) => {
  // 这个组件可以在路由级别使用来预加载数据
  React.useEffect(() => {
    // 预加载逻辑可以在这里实现
    // 例如：prefetchLeadsData(userId)
  }, [userId])

  return <LeadsContainer />
}
