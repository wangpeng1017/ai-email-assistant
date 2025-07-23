'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // 如果正在加载或用户未登录，返回简单布局
  if (loading || !user) {
    return <>{children}</>
  }

  // 只在dashboard页面显示新布局
  const showNewLayout = pathname.startsWith('/dashboard')

  if (!showNewLayout) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 主内容区域 - 移除了侧边栏和旧的顶部导航 */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  )
}
