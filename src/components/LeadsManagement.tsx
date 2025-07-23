'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import { supabase } from '@/lib/supabase'

interface Lead {
  id: string
  customer_name: string
  customer_email: string
  customer_website: string
  source: string
  status: string
  created_at: string
  updated_at: string
  notes?: string
  last_contact?: string
  next_follow_up?: string
}

export default function LeadsManagement() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // 暂时未使用这些状态，但保留以备将来的编辑功能
  console.log('Debug - selectedLead:', selectedLead, 'isEditModalOpen:', isEditModalOpen)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  // 获取线索列表
  const fetchLeads = useCallback(async () => {
    if (!user) return

    try {
      // 首先尝试从customer_leads表获取数据
      let query = supabase
        .from('customer_leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // 应用过滤器
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter)
      }

      let data, error
      try {
        const result = await query
        data = result.data
        error = result.error
      } catch (e) {
        error = e
      }

      // 如果customer_leads表不存在，回退到leads表
      if (error && error.message.includes('relation "public.customer_leads" does not exist')) {
        console.log('customer_leads表不存在，回退到leads表')
        let leadsQuery = supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // 应用过滤器（需要映射状态）
        if (statusFilter !== 'all') {
          const mappedStatus = mapNewStatusToOld(statusFilter)
          leadsQuery = leadsQuery.eq('status', mappedStatus)
        }

        if (sourceFilter !== 'all') {
          const mappedSource = mapNewSourceToOld(sourceFilter)
          leadsQuery = leadsQuery.eq('source', mappedSource)
        }

        const { data: leadsData, error: leadsError } = await leadsQuery

        if (leadsError) throw leadsError

        // 映射leads表数据到新格式
        data = leadsData?.map(lead => ({
          id: lead.id,
          user_id: lead.user_id,
          customer_name: lead.customer_name || 'Unknown',
          company_name: lead.customer_website || '',
          email: lead.customer_email || '',
          phone: lead.phone || '',
          website: lead.customer_website || '',
          source: mapOldSourceToNew(lead.source),
          status: mapOldStatusToNew(lead.status),
          notes: lead.notes || '',
          industry: '',
          company_size: '',
          generated_email_subject: lead.generated_mail_subject || '',
          generated_email_body: lead.generated_mail_body || '',
          gmail_draft_id: lead.gmail_draft_id || '',
          gmail_message_id: lead.gmail_message_id || '',
          sent_at: lead.sent_at,
          created_at: lead.created_at,
          updated_at: lead.updated_at || lead.created_at
        })) || []
      } else if (error) {
        throw error
      }

      setLeads(data || [])
    } catch (error) {
      console.error('获取线索失败:', error)
      showNotification('error', '加载失败', '无法获取客户线索列表')
    } finally {
      setLoading(false)
    }
  }, [user, statusFilter, sourceFilter, showNotification])

  // 状态映射辅助函数
  const mapOldStatusToNew = (oldStatus: string): string => {
    switch (oldStatus) {
      case 'pending': return 'new'
      case 'processing': return 'contacted'
      case 'completed': return 'converted'
      case 'failed': return 'lost'
      default: return 'new'
    }
  }

  const mapNewStatusToOld = (newStatus: string): string => {
    switch (newStatus) {
      case 'new': return 'pending'
      case 'contacted': return 'processing'
      case 'converted': return 'completed'
      case 'lost': return 'failed'
      default: return 'pending'
    }
  }

  const mapOldSourceToNew = (oldSource: string): string => {
    switch (oldSource) {
      case 'excel': return 'excel_import'
      case 'manual': return 'manual'
      case 'scraped': return 'scraped'
      default: return 'manual'
    }
  }

  const mapNewSourceToOld = (newSource: string): string => {
    switch (newSource) {
      case 'excel_import': return 'excel'
      case 'manual': return 'manual'
      case 'scraped': return 'scraped'
      default: return 'manual'
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // 过滤线索
  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      lead.customer_name.toLowerCase().includes(term) ||
      lead.customer_email.toLowerCase().includes(term) ||
      lead.customer_website.toLowerCase().includes(term)
    )
  })

  // 更新线索状态
  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('customer_leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('user_id', user?.id)

      if (error) throw error

      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: newStatus, updated_at: new Date().toISOString() }
          : lead
      ))

      showNotification('success', '更新成功', '线索状态已更新')
    } catch (error) {
      console.error('更新状态失败:', error)
      showNotification('error', '更新失败', '无法更新线索状态')
    }
  }

  // 删除线索
  const deleteLead = async (leadId: string) => {
    if (!confirm('确定要删除这条线索吗？此操作无法撤销。')) return

    try {
      // 首先尝试从customer_leads表删除
      let deleteError
      try {
        const result = await supabase
          .from('customer_leads')
          .delete()
          .eq('id', leadId)
          .eq('user_id', user?.id)

        deleteError = result.error
      } catch (e) {
        deleteError = e
      }

      // 如果customer_leads表不存在，回退到leads表
      if (deleteError && deleteError.message.includes('relation "public.customer_leads" does not exist')) {
        console.log('customer_leads表不存在，回退到leads表')
        const { error: leadsError } = await supabase
          .from('leads')
          .delete()
          .eq('id', leadId)
          .eq('user_id', user?.id)

        if (leadsError) throw leadsError
      } else if (deleteError) {
        throw deleteError
      }

      setLeads(prev => prev.filter(lead => lead.id !== leadId))
      showNotification('success', '删除成功', '线索已删除')
    } catch (error) {
      console.error('删除失败:', error)
      showNotification('error', '删除失败', '无法删除线索')
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和统计 */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">客户线索管理</h1>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{leads.length}</div>
            <div className="text-sm text-blue-600">总线索数</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {leads.filter(l => l.status === 'qualified').length}
            </div>
            <div className="text-sm text-green-600">已验证</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {leads.filter(l => l.status === 'contacted').length}
            </div>
            <div className="text-sm text-yellow-600">已联系</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {leads.filter(l => l.status === 'converted').length}
            </div>
            <div className="text-sm text-purple-600">已转化</div>
          </div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              搜索线索
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索公司名称、邮箱或网站..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              状态筛选
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="new">新线索</option>
              <option value="contacted">已联系</option>
              <option value="qualified">已验证</option>
              <option value="converted">已转化</option>
              <option value="lost">已流失</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 mb-2">
              来源筛选
            </label>
            <select
              id="source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部来源</option>
              <option value="manual">手动添加</option>
              <option value="excel_import">Excel导入</option>
              <option value="scraped">网页爬取</option>
            </select>
          </div>
        </div>
      </div>

      {/* 线索列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              线索列表 ({filteredLeads.length} 条)
            </h2>
          </div>
          
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' 
                  ? '没有找到匹配的线索' 
                  : '还没有任何客户线索'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      客户信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      来源
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.customer_email}
                          </div>
                          <div className="text-sm text-blue-600">
                            {lead.customer_website}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(lead.status)}`}
                        >
                          <option value="new">新线索</option>
                          <option value="contacted">已联系</option>
                          <option value="qualified">已验证</option>
                          <option value="converted">已转化</option>
                          <option value="lost">已流失</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getSourceLabel(lead.source)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedLead(lead)
                            setIsEditModalOpen(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
