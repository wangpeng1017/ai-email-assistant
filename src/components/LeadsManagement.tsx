'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import { supabase } from '@/lib/supabase'
import { useDbCache } from '@/hooks/useDataCache'
import { useApiPerformanceMonitor } from '@/hooks/usePerformanceMonitor'

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
  const cache = useDbCache()
  const performanceMonitor = useApiPerformanceMonitor()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // 暂时未使用这些状态，但保留以备将来的编辑功能
  console.log('Debug - selectedLead:', selectedLead, 'isEditModalOpen:', isEditModalOpen)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newLead, setNewLead] = useState({
    customer_name: '',
    company_name: '',
    email: '',
    phone: '',
    website: '',
    notes: ''
  })
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  // 获取线索列表 - 使用API而不是直接数据库查询
  const fetchLeads = useCallback(async () => {
    if (!user || loading) return // 防止重复请求

    setLoading(true)
    try {
      console.log('📊 获取线索列表，参数:', {
        userId: user.id,
        status: statusFilter,
        source: sourceFilter
      })

      const params = new URLSearchParams({
        userId: user.id,
        status: statusFilter,
        source: sourceFilter,
        search: '',
        page: '1',
        limit: '100'
      })

      const response = await fetch(`/api/leads?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ API响应成功:', {
        success: result.success,
        dataCount: result.data?.length,
        total: result.pagination?.total
      })

      if (result.success) {
        setLeads(result.data || [])
      } else {
        throw new Error(result.error || '获取线索失败')
      }

    } catch (error) {
      console.error('获取线索失败:', error)
      setLeads([]) // 设置空数组，避免无限重试
      const errorMessage = error instanceof Error ? error.message : '无法获取客户线索列表'
      showNotification('error', '加载失败', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, statusFilter, sourceFilter, showNotification, loading])

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

  // 手动添加线索
  const addLead = async () => {
    if (!user || !newLead.customer_name.trim()) {
      showNotification('error', '验证失败', '请填写客户姓名')
      return
    }

    try {
      const leadData = {
        userId: user.id,
        customer_name: newLead.customer_name.trim(),
        company_name: newLead.company_name.trim() || '',
        email: newLead.email.trim() || '',
        phone: newLead.phone.trim() || '',
        website: newLead.website.trim() || '',
        notes: newLead.notes.trim() || '',
        source: 'manual'
      }

      console.log('发送添加线索请求:', leadData)

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('添加线索成功:', result)

      if (result.success) {
        // 重新获取线索列表
        await fetchLeads()

        // 重置表单
        setNewLead({
          customer_name: '',
          company_name: '',
          email: '',
          phone: '',
          website: '',
          notes: ''
        })
        setShowAddForm(false)

        showNotification('success', '添加成功', '客户线索已成功添加')
      } else {
        throw new Error(result.message || '添加失败')
      }
    } catch (error) {
      console.error('添加线索失败:', error)
      const errorMessage = error instanceof Error ? error.message : '无法添加客户线索'
      showNotification('error', '添加失败', errorMessage)
    }
  }

  // 批量导入线索
  const importLeads = async () => {
    if (!user || !importFile) {
      showNotification('error', '验证失败', '请选择要导入的文件')
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('userId', user.id)

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('导入失败')
      }

      const result = await response.json()

      if (result.success) {
        await fetchLeads()
        setImportFile(null)
        setShowImportModal(false)
        showNotification('success', '导入成功', `成功导入 ${result.count} 条线索`)
      } else {
        throw new Error(result.error || '导入失败')
      }
    } catch (error) {
      console.error('导入线索失败:', error)
      showNotification('error', '导入失败', '无法导入客户线索')
    } finally {
      setImporting(false)
    }
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]

      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFile(file)
      } else {
        showNotification('error', '文件格式错误', '请选择Excel或CSV文件')
        event.target.value = ''
      }
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
      let deleteError: Error | null = null

      try {
        const result = await supabase
          .from('customer_leads')
          .delete()
          .eq('id', leadId)
          .eq('user_id', user?.id)

        deleteError = result.error as Error | null
      } catch (e) {
        deleteError = e as Error
      }

      // 如果customer_leads表不存在，回退到leads表
      if (deleteError && 'message' in deleteError && deleteError.message.includes('relation "public.customer_leads" does not exist')) {
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

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          手动添加线索
        </button>

        <button
          onClick={() => setShowImportModal(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          批量导入
        </button>
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

      {/* 手动添加线索模态框 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加新线索</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客户姓名 *
                </label>
                <input
                  type="text"
                  value={newLead.customer_name}
                  onChange={(e) => setNewLead({...newLead, customer_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入客户姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公司名称
                </label>
                <input
                  type="text"
                  value={newLead.company_name}
                  onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入公司名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入邮箱地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  电话号码
                </label>
                <input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入电话号码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  网站地址
                </label>
                <input
                  type="url"
                  value={newLead.website}
                  onChange={(e) => setNewLead({...newLead, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入网站地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注信息
                </label>
                <textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入备注信息"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewLead({
                    customer_name: '',
                    company_name: '',
                    email: '',
                    phone: '',
                    website: '',
                    notes: ''
                  })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onClick={addLead}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                添加线索
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">批量导入线索</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择文件
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  支持Excel (.xlsx, .xls) 和CSV (.csv) 格式
                </p>
              </div>

              {importFile && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    已选择文件: {importFile.name}
                  </p>
                  <p className="text-xs text-blue-600">
                    文件大小: {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <div className="p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-700 font-medium mb-1">文件格式要求：</p>
                <ul className="text-xs text-yellow-600 space-y-1">
                  <li>• 第一行为标题行</li>
                  <li>• 必需列：客户姓名</li>
                  <li>• 可选列：公司名称、邮箱、电话、网站、备注</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                }}
                disabled={importing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={importLeads}
                disabled={!importFile || importing}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? '导入中...' : '开始导入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
