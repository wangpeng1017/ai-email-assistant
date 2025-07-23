'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import ManualInputForm from '@/components/ManualInputForm'
import BatchImportForm from '@/components/BatchImportForm'
import WebScrapingForm from '@/components/WebScrapingForm'
import ProductMaterialsManager from '@/components/ProductMaterialsManager'
import LeadsManagement from '@/components/LeadsManagement'
import EmailTemplates from '@/components/EmailTemplates'
import Analytics from '@/components/Analytics'
import Settings from '@/components/Settings'
import LeadsList from '@/components/LeadsList'
import NavigationTabs from '@/components/NavigationTabs'
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
  const tabFromUrl = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState(tabFromUrl || 'manual')
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [processing, setProcessing] = useState(false)
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
    setShowForm(false)
    setRefreshKey(prev => prev + 1) // 触发LeadsList重新获取数据
    fetchStats() // 更新统计信息
    showSuccess('添加成功', '客户线索已成功添加，可以开始处理了')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setShowForm(false) // 切换标签时关闭表单
  }

  const handleOpenForm = () => {
    setShowForm(true)
  }

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('status')
        .eq('user_id', user.id)

      if (error) throw error

      const stats = {
        total: data.length,
        pending: data.filter(lead => lead.status === 'pending').length,
        processing: data.filter(lead => lead.status === 'processing').length,
        completed: data.filter(lead => lead.status === 'completed').length,
        failed: data.filter(lead => lead.status === 'failed').length,
      }

      setStats(stats)
    } catch (error) {
      logError(error, 'fetchStats')
      showError('获取统计失败', getErrorMessage(error))
    }
  }, [user, showError])

  useEffect(() => {
    fetchStats()
  }, [fetchStats, refreshKey])

  const handleStartAutomation = async () => {
    if (!user) return

    setProcessing(true)
    try {
      const response = await fetch('/api/automation/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const result = await response.json()

      if (response.ok) {
        showSuccess('处理启动成功', result.message || '自动化处理已启动')
        setRefreshKey(prev => prev + 1)
        fetchStats()
      } else {
        showError('启动失败', result.error || '启动自动化处理失败')
      }
    } catch (error) {
      logError(error, 'handleStartAutomation')
      showError('启动失败', getErrorMessage(error))
    } finally {
      setProcessing(false)
    }
  }

  // 根据URL参数确定当前视图
  const getCurrentView = () => {
    const tab = tabFromUrl || 'dashboard'
    switch (tab) {
      case 'leads':
        return 'leads'
      case 'materials':
        return 'materials'
      case 'templates':
        return 'templates'
      case 'analytics':
        return 'analytics'
      case 'settings':
        return 'settings'
      default:
        return 'dashboard'
    }
  }

  const currentView = getCurrentView()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* 根据当前视图渲染不同内容 */}
        {currentView === 'dashboard' && (
          <>
            {/* Navigation Tabs */}
            <NavigationTabs activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
              <div className="px-4 sm:px-0">
            {/* 统计卡片 - 压缩间距 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{stats.total}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">总线索</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{stats.pending}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">待处理</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{stats.processing}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">处理中</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.processing}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{stats.completed}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">已完成</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.completed}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{stats.failed}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">失败</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.failed}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 数据输入区域 */}
            {!showForm ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    添加客户线索
                  </h2>
                  <p className="text-gray-600 mb-4">
                    选择一种方式添加客户信息，然后使用AI自动生成个性化邮件
                  </p>
                  <button
                    onClick={handleOpenForm}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {activeTab === 'manual' && '手动输入客户信息'}
                    {activeTab === 'batch' && '上传Excel文件'}
                    {activeTab === 'scraping' && '开始网页爬取'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                {activeTab === 'manual' && (
                  <ManualInputForm
                    onClose={() => setShowForm(false)}
                    onSubmit={handleFormSubmit}
                  />
                )}
                {activeTab === 'batch' && (
                  <BatchImportForm
                    onClose={() => setShowForm(false)}
                    onSubmit={handleFormSubmit}
                  />
                )}
                {activeTab === 'scraping' && (
                  <WebScrapingForm
                    onClose={() => setShowForm(false)}
                    onSubmit={handleFormSubmit}
                  />
                )}
              </div>
            )}

            {/* 自动化处理区域 - 突出显示 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6 mb-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI自动化邮件生成
                </h3>
                <p className="text-gray-600 mb-6">
                  一键为所有待处理的客户线索生成个性化邮件内容，提升营销效率
                </p>
                <button
                  onClick={handleStartAutomation}
                  disabled={processing}
                  className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                    processing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI正在处理中...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      启动自动化处理
                    </div>
                  )}
                </button>
                <p className="mt-3 text-sm text-gray-500">
                  智能分析网站内容 • 生成个性化邮件 • 提升转化率
                </p>
              </div>
            </div>

            {/* 客户线索列表 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  客户线索列表
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  管理您的客户线索，查看AI生成的邮件内容
                </p>
              </div>
              <div className="p-6">
                <LeadsList key={refreshKey} />
              </div>
            </div>
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
          </>
        )}

        {/* 其他视图的占位符 */}
        {currentView === 'leads' && (
          <LeadsManagement />
        )}

        {currentView === 'materials' && (
          <ProductMaterialsManager />
        )}

        {currentView === 'templates' && (
          <EmailTemplates />
        )}

        {currentView === 'analytics' && (
          <Analytics />
        )}

        {currentView === 'settings' && (
          <Settings />
        )}
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
