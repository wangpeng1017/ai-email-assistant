'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import MainNavigation from '@/components/MainNavigation'
import LeadsSubNavigation from '@/components/LeadsSubNavigation'
import LeadAcquisitionSubNavigation from '@/components/LeadAcquisitionSubNavigation'
import WebScrapingForm from '@/components/WebScrapingForm'
import DataExtractionForm from '@/components/DataExtractionForm'
import LeadDiscoveryForm from '@/components/LeadDiscoveryForm'
import BatchImportForm from '@/components/BatchImportForm'
import ManualAddForm from '@/components/ManualAddForm'
import MaterialsContainer from '@/components/materials/MaterialsContainer'
import LeadsContainer from '@/components/leads/LeadsContainer'
import AIEmailWorkflow from '@/components/AIEmailWorkflow'
import EmailTemplates from '@/components/EmailTemplates'

import Settings from '@/components/Settings'
import Notification, { useNotification } from '@/components/Notification'



// 内部组件处理搜索参数
function DashboardContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const menuFromUrl = searchParams.get('menu')
  const subMenuFromUrl = searchParams.get('submenu')

  const [activeMenu, setActiveMenu] = useState(menuFromUrl || 'leads')
  const [activeSubMenu, setActiveSubMenu] = useState(subMenuFromUrl || 'management')
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    notification,
    showSuccess,
    showError,
    hideNotification
  } = useNotification()

  const handleFormSubmit = () => {
    setRefreshKey(prev => prev + 1) // 触发数据重新获取
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



  // 渲染内容的辅助函数
  const renderContent = () => {
    switch (activeMenu) {
      case 'lead-acquisition':
        return renderLeadAcquisitionContent()
      case 'leads':
        return renderLeadsContent()
      case 'materials':
        return <MaterialsContainer />
      case 'ai-email':
        return <AIEmailWorkflow />
      case 'templates':
        return <EmailTemplates />
      case 'settings':
        return <Settings />
      default:
        return renderLeadAcquisitionContent()
    }
  }

  const renderLeadAcquisitionContent = () => {
    switch (activeSubMenu) {
      case 'web-scraping':
        return <WebScrapingForm onSubmit={handleFormSubmit} />
      case 'data-extraction':
        return <DataExtractionForm onSubmit={handleFormSubmit} />
      case 'lead-discovery':
        return <LeadDiscoveryForm onSubmit={handleFormSubmit} />
      default:
        return <WebScrapingForm onSubmit={handleFormSubmit} />
    }
  }

  const renderLeadsContent = () => {
    switch (activeSubMenu) {
      case 'management':
        return <LeadsContainer />
      case 'import':
        return <BatchImportForm onClose={() => setActiveSubMenu('management')} onSubmit={handleFormSubmit} />
      case 'manual':
        return <ManualAddForm onSubmit={handleFormSubmit} />
      default:
        return <LeadsContainer />
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* 主导航 */}
        <MainNavigation activeMenu={activeMenu} onMenuChange={handleMenuChange} />

        {/* 线索获取子导航 */}
        {activeMenu === 'lead-acquisition' && (
          <LeadAcquisitionSubNavigation activeSubMenu={activeSubMenu} onSubMenuChange={handleSubMenuChange} />
        )}

        {/* 线索管理子导航 */}
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
