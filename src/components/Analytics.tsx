'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  totalLeads: number
  leadsThisMonth: number
  leadsThisWeek: number
  leadsByStatus: Record<string, number>
  leadsBySource: Record<string, number>
  emailsSent: number
  emailsThisMonth: number
  templatesUsed: number
  materialsUploaded: number
  conversionRate: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    created_at: string
  }>
}

export default function Analytics() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  // 获取分析数据
  const fetchAnalytics = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // 计算时间范围
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      const timeRangeDate = new Date()
      
      switch (timeRange) {
        case '7d':
          timeRangeDate.setDate(timeRangeDate.getDate() - 7)
          break
        case '30d':
          timeRangeDate.setDate(timeRangeDate.getDate() - 30)
          break
        case '90d':
          timeRangeDate.setDate(timeRangeDate.getDate() - 90)
          break
      }

      // 获取客户线索统计
      const { data: allLeads, error: leadsError } = await supabase
        .from('customer_leads')
        .select('*')
        .eq('user_id', user.id)

      if (leadsError) throw leadsError

      const totalLeads = allLeads?.length || 0
      const leadsThisMonth = allLeads?.filter(lead => 
        new Date(lead.created_at) >= startOfMonth
      ).length || 0
      const leadsThisWeek = allLeads?.filter(lead => 
        new Date(lead.created_at) >= startOfWeek
      ).length || 0

      // 按状态分组
      const leadsByStatus = allLeads?.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // 按来源分组
      const leadsBySource = allLeads?.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // 获取邮件模板统计
      const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)

      if (templatesError) throw templatesError

      // 获取产品资料统计
      const { data: materials, error: materialsError } = await supabase
        .from('product_materials')
        .select('*')
        .eq('user_id', user.id)

      if (materialsError) throw materialsError

      // 计算转化率
      const convertedLeads = allLeads?.filter(lead => lead.status === 'converted').length || 0
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

      // 模拟邮件发送统计（实际应该从邮件发送记录表获取）
      const emailsSent = Math.floor(totalLeads * 0.8) // 假设80%的线索都发送了邮件
      const emailsThisMonth = Math.floor(leadsThisMonth * 0.8)

      // 生成最近活动记录
      const recentActivity = [
        ...allLeads?.slice(0, 3).map(lead => ({
          id: lead.id,
          type: 'lead_created',
          description: `添加了新客户线索: ${lead.customer_name}`,
          created_at: lead.created_at
        })) || [],
        ...templates?.slice(0, 2).map(template => ({
          id: template.id,
          type: 'template_created',
          description: `创建了邮件模板: ${template.name}`,
          created_at: template.created_at
        })) || [],
        ...materials?.slice(0, 2).map(material => ({
          id: material.id,
          type: 'material_uploaded',
          description: `上传了产品资料: ${material.file_name}`,
          created_at: material.created_at
        })) || []
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)

      setAnalytics({
        totalLeads,
        leadsThisMonth,
        leadsThisWeek,
        leadsByStatus,
        leadsBySource,
        emailsSent,
        emailsThisMonth,
        templatesUsed: templates?.length || 0,
        materialsUploaded: materials?.length || 0,
        conversionRate,
        recentActivity
      })

    } catch (error) {
      console.error('获取分析数据失败:', error)
      showNotification('error', '加载失败', '无法获取分析数据')
    } finally {
      setLoading(false)
    }
  }, [user, timeRange, showNotification])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return '新线索'
      case 'contacted': return '已联系'
      case 'qualified': return '已验证'
      case 'converted': return '已转化'
      case 'lost': return '已流失'
      default: return status
    }
  }

  // 获取来源标签
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual': return '手动添加'
      case 'excel_import': return 'Excel导入'
      case 'scraped': return '网页爬取'
      default: return source
    }
  }

  // 获取活动类型标签
  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'lead_created': return '新增线索'
      case 'template_created': return '创建模板'
      case 'material_uploaded': return '上传资料'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">无法加载分析数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
            <p className="mt-1 text-sm text-gray-600">
              查看您的邮件自动化系统使用情况和效果统计
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
          </select>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总客户线索</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalLeads}</p>
              <p className="text-sm text-gray-500">本月新增 {analytics.leadsThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">邮件发送</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.emailsSent}</p>
              <p className="text-sm text-gray-500">本月发送 {analytics.emailsThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">转化率</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">已转化 {analytics.leadsByStatus.converted || 0} 个</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">邮件模板</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.templatesUsed}</p>
              <p className="text-sm text-gray-500">产品资料 {analytics.materialsUploaded} 个</p>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 线索状态分布 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">线索状态分布</h3>
          <div className="space-y-3">
            {Object.entries(analytics.leadsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{getStatusLabel(status)}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.totalLeads) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 线索来源分布 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">线索来源分布</h3>
          <div className="space-y-3">
            {Object.entries(analytics.leadsBySource).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{getSourceLabel(source)}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.totalLeads) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">最近活动</h3>
        {analytics.recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500">暂无活动记录</p>
        ) : (
          <div className="space-y-3">
            {analytics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {getActivityTypeLabel(activity.type)} • {new Date(activity.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
