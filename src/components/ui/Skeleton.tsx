import React from 'react'

// 基础骨架屏组件
interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
  animate?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true
}) => {
  const baseClasses = 'bg-gray-200'
  const animateClasses = animate ? 'animate-pulse' : ''
  const roundedClasses = rounded ? 'rounded-full' : 'rounded'
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }
  
  return (
    <div
      className={`${baseClasses} ${animateClasses} ${roundedClasses} ${className}`}
      style={style}
    />
  )
}

// 文本骨架屏
const TextSkeleton: React.FC<{
  lines?: number
  className?: string
}> = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="1rem"
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  )
}

// 头像骨架屏
const AvatarSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  return (
    <Skeleton
      className={`${sizeClasses[size]} ${className}`}
      rounded
    />
  )
}

// 按钮骨架屏
const ButtonSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32'
  }
  
  return (
    <Skeleton
      className={`${sizeClasses[size]} rounded-md ${className}`}
    />
  )
}

// 卡片骨架屏
const CardSkeleton: React.FC<{
  className?: string
  showHeader?: boolean
  showFooter?: boolean
}> = ({ className = '', showHeader = true, showFooter = false }) => {
  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center space-x-4 mb-4">
          <AvatarSkeleton size="md" />
          <div className="flex-1">
            <Skeleton height="1.25rem" width="60%" className="mb-2" />
            <Skeleton height="1rem" width="40%" />
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <TextSkeleton lines={3} />
      </div>
      
      {showFooter && (
        <div className="flex justify-between items-center mt-6">
          <ButtonSkeleton size="sm" />
          <div className="flex space-x-2">
            <ButtonSkeleton size="sm" />
            <ButtonSkeleton size="sm" />
          </div>
        </div>
      )}
    </div>
  )
}

// 表格骨架屏
const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* 表头 */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              height="1.25rem"
              width={index === 0 ? '25%' : '20%'}
            />
          ))}
        </div>
      </div>
      
      {/* 表格行 */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-6 py-4">
            <div className="flex space-x-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  height="1rem"
                  width={colIndex === 0 ? '25%' : '20%'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 列表骨架屏
const ListSkeleton: React.FC<{
  items?: number
  className?: string
  showAvatar?: boolean
}> = ({ items = 5, className = '', showAvatar = true }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
          {showAvatar && <AvatarSkeleton size="md" />}
          <div className="flex-1">
            <Skeleton height="1.25rem" width="60%" className="mb-2" />
            <Skeleton height="1rem" width="80%" className="mb-1" />
            <Skeleton height="0.875rem" width="40%" />
          </div>
          <div className="flex space-x-2">
            <ButtonSkeleton size="sm" />
            <ButtonSkeleton size="sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

// 网格骨架屏
const GridSkeleton: React.FC<{
  items?: number
  columns?: number
  className?: string
}> = ({ items = 6, columns = 3, className = '' }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }
  
  return (
    <div className={`grid ${gridClasses[columns as keyof typeof gridClasses] || 'grid-cols-3'} gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <CardSkeleton key={index} showHeader={false} />
      ))}
    </div>
  )
}

// 统计卡片骨架屏
const StatCardSkeleton: React.FC<{
  className?: string
}> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton height="0.875rem" width="60%" className="mb-2" />
          <Skeleton height="2rem" width="40%" />
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Skeleton width="1.5rem" height="1.5rem" />
        </div>
      </div>
    </div>
  )
}

// 页面骨架屏
const PageSkeleton: React.FC<{
  showHeader?: boolean
  showSidebar?: boolean
  className?: string
}> = ({ showHeader = true, showSidebar = false, className = '' }) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {showHeader && (
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton height="2rem" width="200px" />
            <div className="flex space-x-4">
              <ButtonSkeleton size="md" />
              <AvatarSkeleton size="sm" />
            </div>
          </div>
        </div>
      )}
      
      <div className="flex">
        {showSidebar && (
          <div className="w-64 bg-white border-r p-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Skeleton width="1.5rem" height="1.5rem" />
                  <Skeleton height="1rem" width="80%" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {/* 页面标题 */}
            <div>
              <Skeleton height="2.5rem" width="300px" className="mb-2" />
              <Skeleton height="1rem" width="500px" />
            </div>
            
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))}
            </div>
            
            {/* 主要内容 */}
            <TableSkeleton rows={8} columns={5} />
          </div>
        </div>
      </div>
    </div>
  )
}

// 导出所有组件
export {
  Skeleton as default,
  TextSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  GridSkeleton,
  StatCardSkeleton,
  PageSkeleton
}
