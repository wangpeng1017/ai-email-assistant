import React from 'react'
import { Skeleton, ButtonSkeleton } from '@/components/ui/Skeleton'

// 材料上传区域骨架屏
export const MaterialsUploadSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="text-center">
          <Skeleton width="4rem" height="4rem" className="mx-auto mb-4 rounded" />
          <Skeleton width="16rem" height="1.25rem" className="mx-auto mb-2" />
          <Skeleton width="20rem" height="1rem" className="mx-auto mb-4" />
          <ButtonSkeleton size="md" className="mx-auto" />
        </div>
      </div>
    </div>
  )
}

// 材料过滤器骨架屏
export const MaterialsFiltersSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          {/* 搜索框 */}
          <div className="flex-1 md:w-64">
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
          
          {/* 文件类型过滤器 */}
          <div className="w-full md:w-40">
            <Skeleton height="2.5rem" className="rounded-md" />
          </div>
          
          {/* 排序选择器 */}
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

// 材料卡片骨架屏
export const MaterialCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* 文件图标 */}
        <div className="flex-shrink-0">
          <Skeleton width="3rem" height="3rem" className="rounded" />
        </div>
        
        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <Skeleton width="80%" height="1.25rem" className="mb-2" />
          <Skeleton width="60%" height="1rem" className="mb-2" />
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <Skeleton width="4rem" height="0.875rem" />
            <Skeleton width="6rem" height="0.875rem" />
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex-shrink-0 flex space-x-2">
          <Skeleton width="2rem" height="2rem" className="rounded" />
          <Skeleton width="2rem" height="2rem" className="rounded" />
          <Skeleton width="2rem" height="2rem" className="rounded" />
        </div>
      </div>
      
      {/* 描述 */}
      <div className="mt-4">
        <Skeleton width="100%" height="1rem" className="mb-1" />
        <Skeleton width="70%" height="1rem" />
      </div>
      
      {/* 标签 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Skeleton width="3rem" height="1.5rem" className="rounded-full" />
        <Skeleton width="4rem" height="1.5rem" className="rounded-full" />
        <Skeleton width="3.5rem" height="1.5rem" className="rounded-full" />
      </div>
    </div>
  )
}

// 材料网格骨架屏
export const MaterialsGridSkeleton: React.FC<{
  items?: number
}> = ({ items = 12 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: items }).map((_, index) => (
        <MaterialCardSkeleton key={index} />
      ))}
    </div>
  )
}

// 材料列表骨架屏
export const MaterialsListSkeleton: React.FC<{
  items?: number
}> = ({ items = 10 }) => {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* 表头 */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex items-center space-x-4">
          <Skeleton width="3rem" height="1.25rem" /> {/* 选择框 */}
          <Skeleton width="25%" height="1.25rem" /> {/* 文件名 */}
          <Skeleton width="15%" height="1.25rem" /> {/* 类型 */}
          <Skeleton width="10%" height="1.25rem" /> {/* 大小 */}
          <Skeleton width="20%" height="1.25rem" /> {/* 描述 */}
          <Skeleton width="15%" height="1.25rem" /> {/* 上传时间 */}
          <Skeleton width="10%" height="1.25rem" /> {/* 操作 */}
        </div>
      </div>
      
      {/* 表格行 */}
      <div className="divide-y">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <Skeleton width="1rem" height="1rem" /> {/* 选择框 */}
              <div className="flex items-center space-x-3 w-[25%]">
                <Skeleton width="2rem" height="2rem" className="rounded" /> {/* 文件图标 */}
                <Skeleton width="70%" height="1rem" /> {/* 文件名 */}
              </div>
              <Skeleton width="15%" height="1rem" /> {/* 类型 */}
              <Skeleton width="10%" height="1rem" /> {/* 大小 */}
              <Skeleton width="20%" height="1rem" /> {/* 描述 */}
              <Skeleton width="15%" height="1rem" /> {/* 上传时间 */}
              <div className="w-[10%] flex space-x-1">
                <Skeleton width="2rem" height="2rem" className="rounded" />
                <Skeleton width="2rem" height="2rem" className="rounded" />
                <Skeleton width="2rem" height="2rem" className="rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 材料分页骨架屏
export const MaterialsPaginationSkeleton: React.FC = () => {
  return (
    <div className="bg-white px-6 py-3 border-t flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Skeleton width="10rem" height="1rem" />
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

// 材料详情模态框骨架屏
export const MaterialDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 文件预览 */}
      <div className="text-center">
        <Skeleton width="8rem" height="8rem" className="mx-auto mb-4 rounded" />
        <Skeleton width="12rem" height="1.5rem" className="mx-auto mb-2" />
        <Skeleton width="8rem" height="1rem" className="mx-auto" />
      </div>
      
      {/* 文件信息 */}
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
      
      {/* 描述 */}
      <div>
        <Skeleton width="4rem" height="1.5rem" className="mb-4" />
        <Skeleton height="6rem" className="rounded-md" />
      </div>
      
      {/* 关键词 */}
      <div>
        <Skeleton width="4rem" height="1.5rem" className="mb-4" />
        <div className="flex flex-wrap gap-2">
          <Skeleton width="4rem" height="2rem" className="rounded-full" />
          <Skeleton width="5rem" height="2rem" className="rounded-full" />
          <Skeleton width="3rem" height="2rem" className="rounded-full" />
          <Skeleton width="6rem" height="2rem" className="rounded-full" />
        </div>
      </div>
      
      {/* 按钮 */}
      <div className="flex justify-end space-x-3">
        <ButtonSkeleton size="md" />
        <ButtonSkeleton size="md" />
        <ButtonSkeleton size="md" />
      </div>
    </div>
  )
}

// 批量上传进度骨架屏
export const BatchUploadSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton width="8rem" height="1.5rem" className="mb-4" />
      </div>
      
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <Skeleton width="2rem" height="2rem" className="rounded" />
            <div className="flex-1">
              <Skeleton width="60%" height="1rem" className="mb-2" />
              <div className="w-full bg-gray-200 rounded-full h-2">
                <Skeleton width="40%" height="0.5rem" className="rounded-full" />
              </div>
            </div>
            <Skeleton width="4rem" height="1rem" />
          </div>
        </div>
      ))}
      
      <div className="flex justify-end space-x-3">
        <ButtonSkeleton size="md" />
        <ButtonSkeleton size="md" />
      </div>
    </div>
  )
}

// 完整的材料页面骨架屏
export const MaterialsPageSkeleton: React.FC<{
  viewMode?: 'grid' | 'list'
}> = ({ viewMode = 'grid' }) => {
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
      
      {/* 上传区域 */}
      <MaterialsUploadSkeleton />
      
      {/* 过滤器 */}
      <MaterialsFiltersSkeleton />
      
      {/* 内容区域 */}
      <div>
        {viewMode === 'grid' ? (
          <MaterialsGridSkeleton items={12} />
        ) : (
          <>
            <MaterialsListSkeleton items={10} />
            <MaterialsPaginationSkeleton />
          </>
        )}
      </div>
    </div>
  )
}

export default MaterialsPageSkeleton
