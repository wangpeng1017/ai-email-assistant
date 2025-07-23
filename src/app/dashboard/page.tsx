'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import MainNavigation from '@/components/MainNavigation'
import LeadsSubNavigation from '@/components/LeadsSubNavigation'
import WebScrapingForm from '@/components/WebScrapingForm'
import ProductMaterialsManager from '@/components/ProductMaterialsManager'
import LeadsManagement from '@/components/LeadsManagement'
import AIEmailWorkflow from '@/components/AIEmailWorkflow'
import EmailTemplates from '@/components/EmailTemplates'
import Analytics from '@/components/Analytics'
import Settings from '@/components/Settings'
import Notification, { useNotification } from '@/components/Notification'
import { supabase } from '@/lib/supabase'
import { getErrorMessage, logError } from '@/lib/errorHandler'

interface LeadStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
}

// 内部组件处理搜索参数
function DashboardContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const menuFromUrl = searchParams.get('menu')
  const subMenuFromUrl = searchParams.get('submenu')

  const [activeMenu, setActiveMenu] = useState(menuFromUrl || 'leads')
  const [activeSubMenu, setActiveSubMenu] = useState(subMenuFromUrl || 'management')
  const [refreshKey, setRefreshKey] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  })

  const {
    notification,
    showSuccess,
    showError,
    hideNotification
  } = useNotification()

  const handleFormSubmit = () => {
    setRefreshKey(prev => prev + 1) // 触发数据重新获取
    fetchStats() // 更新统计信息
    showSuccess('添加成功', '客户线索已成功添加')
  }

  const handleMenuChange = (menu: string) => {
    setActiveMenu(menu)
    // 根据菜单设置默认子菜单
    if (menu === 'leads') {
      setActiveSubMenu('management')
    }
  }

  const handleSubMenuChange = (subMenu: string) => {
    setActiveSubMenu(subMenu)
  }

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      // 首先尝试从customer_leads表获取数据
      let data: { status: string }[] | null = null
      let error: Error | null = null

      try {
        const result = await supabase
          .from('customer_leads')
          .select('status')
          .eq('user_id', user.id)

        data = result.data
        error = result.error as Error | null
      } catch (e) {
        error = e as Error
      }

      // 如果customer_leads表不存在，回退到leads表
      if (error && 'message' in error && error.message.includes('relation "public.customer_leads" does not exist')) {
        console.log('customer_leads表不存在，回退到leads表')
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('status')
          .eq('user_id', user.id)

        if (leadsError) throw leadsError

        // 映射leads表的状态到新的状态系统
        const mappedData = leadsData?.map(lead => ({
          status: mapOldStatusToNew(lead.status)
        })) || []

        data = mappedData
      } else if (error) {
        throw error
      }

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(lead => lead.status === 'new').length || 0,
        processing: data?.filter(lead => lead.status === 'contacted').length || 0,
        completed: data?.filter(lead => lead.status === 'converted').length || 0,
        failed: data?.filter(lead => lead.status === 'lost').length || 0,
      }

      setStats(stats)
    } catch (error) {
      logError(error, 'fetchStats')
      showError('获取统计失败', getErrorMessage(error))
    }
  }, [user, showError])

  // 映射旧状态到新状态的辅助函数
  const mapOldStatusToNew = (oldStatus: string): string => {
    switch (oldStatus) {
      case 'pending': return 'new'
      case 'processing': return 'contacted'
      case 'completed': return 'converted'
      case 'failed': return 'lost'
      default: return 'new'
    }
  }

  useEffect(() => {
    fetchStats()
  }, [fetchStats, refreshKey])

  // 渲染内容的辅助函数
  const renderContent = () => {
    switch (activeMenu) {
      case 'leads':
        return renderLeadsContent()
      case 'materials':
        return <ProductMaterialsManager />
      case 'ai-email':
        return <AIEmailWorkflow />
      case 'templates':
        return <EmailTemplates />
      case 'analytics':
        return <Analytics />
      case 'settings':
        return <Settings />
      default:
        return renderLeadsContent()
    }
  }

  const renderLeadsContent = () => {
    switch (activeSubMenu) {
      case 'management':
        return <LeadsManagement />
      case 'scraping':
        return <WebScrapingForm onSubmit={handleFormSubmit} />
      default:
        return <LeadsManagement />
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* 主导航 */}
        <MainNavigation activeMenu={activeMenu} onMenuChange={handleMenuChange} />
        
        {/* 客户线索子导航 */}
        {activeMenu === 'leads' && (
          <LeadsSubNavigation activeSubMenu={activeSubMenu} onSubMenuChange={handleSubMenuChange} />
        )}

        {/* 主要内容区域 - 响应式侧边栏空间 */}
        <div className="md:ml-64 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-6 pt-16 md:pt-6">
            {renderContent()}
          </div>
        </div>

        {/* 通知组件 */}
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// 主导出组件包装在Suspense中
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
