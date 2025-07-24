import React from 'react'
import { Skeleton, StatCardSkeleton, ButtonSkeleton } from '@/components/ui/Skeleton'

// 线索统计骨架屏
export const LeadsStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  )
}

// 线索过滤器骨架屏
export const LeadsFiltersSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          {/* 搜索框 */}
          <div className="flex-1 md:w-64">
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
          
          {/* 状态过滤器 */}
          <div className="w-full md:w-40">
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
          
          {/* 来源过滤器 */}
          <div className="w-full md:w-40">
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <ButtonSkeleton size="md" />
          <ButtonSkeleton size="md" />
        </div>
      </div>
    </div>
  )
}

// 线索表格骨架屏
export const LeadsTableSkeleton: React.FC<{
  rows?: number
}> = ({ rows = 10 }) => {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* 表头 */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex items-center space-x-4">
          <Skeleton width="3rem" height="1.25rem" /> {/* 选择框 */}
          <Skeleton width="15%" height="1.25rem" /> {/* 客户名称 */}
          <Skeleton width="20%" height="1.25rem" /> {/* 邮箱 */}
          <Skeleton width="15%" height="1.25rem" /> {/* 网站 */}
          <Skeleton width="10%" height="1.25rem" /> {/* 来源 */}
          <Skeleton width="10%" height="1.25rem" /> {/* 状态 */}
          <Skeleton width="15%" height="1.25rem" /> {/* 创建时间 */}
          <Skeleton width="10%" height="1.25rem" /> {/* 操作 */}
        </div>
      </div>
      
      {/* 表格行 */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <Skeleton width="1rem" height="1rem" /> {/* 选择框 */}
              <Skeleton width="15%" height="1rem" /> {/* 客户名称 */}
              <Skeleton width="20%" height="1rem" /> {/* 邮箱 */}
              <Skeleton width="15%" height="1rem" /> {/* 网站 */}
              <Skeleton width="10%" height="1rem" /> {/* 来源 */}
              <div className="w-[10%]">
                <Skeleton width="4rem" height="1.5rem" className="rounded-full" /> {/* 状态标签 */}
              </div>
              <Skeleton width="15%" height="1rem" /> {/* 创建时间 */}
              <div className="w-[10%] flex space-x-1">
                <Skeleton width="2rem" height="2rem" className="rounded" /> {/* 编辑按钮 */}
                <Skeleton width="2rem" height="2rem" className="rounded" /> {/* 删除按钮 */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 线索分页骨架屏
export const LeadsPaginationSkeleton: React.FC = () => {
  return (
    <div className="bg-white px-6 py-3 border-t flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Skeleton width="8rem" height="1rem" /> {/* 显示信息 */}
      </div>
      
      <div className="flex items-center space-x-2">
        <ButtonSkeleton size="sm" />
        <Skeleton width="2rem" height="2rem" className="rounded" />
        <Skeleton width="2rem" height="2rem" className="rounded" />
        <Skeleton width="2rem" height="2rem" className="rounded" />
        <ButtonSkeleton size="sm" />
      </div>
    </div>
  )
}

// 线索详情模态框骨架屏
export const LeadDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div>
        <Skeleton width="8rem" height="1.5rem" className="mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton width="4rem" height="1rem" className="mb-2" />
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
          <div>
            <Skeleton width="4rem" height="1rem" className="mb-2" />
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
          <div>
            <Skeleton width="4rem" height="1rem" className="mb-2" />
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
          <div>
            <Skeleton width="4rem" height="1rem" className="mb-2" />
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
        </div>
      </div>
      
      {/* 状态信息 */}
      <div>
        <Skeleton width="6rem" height="1.5rem" className="mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton width="4rem" height="1rem" className="mb-2" />
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
          <div>
            <Skeleton width="4rem" height="1rem" className="mb-2" />
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
        </div>
      </div>
      
      {/* 备注 */}
      <div>
        <Skeleton width="4rem" height="1.5rem" className="mb-4" />
        <Skeleton height="6rem" className="rounded-md" />
      </div>
      
      {/* 按钮 */}
      <div className="flex justify-end space-x-3">
        <ButtonSkeleton size="md" />
        <ButtonSkeleton size="md" />
      </div>
    </div>
  )
}

// 线索导入模态框骨架屏
export const LeadImportSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton width="8rem" height="1.5rem" className="mb-4" />
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center">
            <Skeleton width="4rem" height="4rem" className="mx-auto mb-4 rounded" />
            <Skeleton width="12rem" height="1.25rem" className="mx-auto mb-2" />
            <Skeleton width="16rem" height="1rem" className="mx-auto" />
          </div>
        </div>
      </div>
      
      <div>
        <Skeleton width="6rem" height="1.5rem" className="mb-4" />
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Skeleton width="1rem" height="1rem" />
                <Skeleton width="80%" height="1rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <ButtonSkeleton size="md" />
        <ButtonSkeleton size="md" />
      </div>
    </div>
  )
}

// 完整的线索页面骨架屏
export const LeadsPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton width="12rem" height="2rem" className="mb-2" />
          <Skeleton width="20rem" height="1rem" />
        </div>
        <div className="flex space-x-3">
          <ButtonSkeleton size="md" />
          <ButtonSkeleton size="md" />
        </div>
      </div>
      
      {/* 统计卡片 */}
      <LeadsStatsSkeleton />
      
      {/* 过滤器 */}
      <LeadsFiltersSkeleton />
      
      {/* 表格 */}
      <div>
        <LeadsTableSkeleton rows={10} />
        <LeadsPaginationSkeleton />
      </div>
    </div>
  )
}

export default LeadsPageSkeleton
