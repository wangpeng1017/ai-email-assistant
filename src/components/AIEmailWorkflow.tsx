'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import { supabase } from '@/lib/supabase'

interface Lead {
  id: string
  customer_name: string
  email: string
  company_name: string
  phone?: string
  source: string
  status: string
  created_at: string
}

interface ProductMaterial {
  id: string
  file_name: string
  file_type: string
  file_size: number
  keywords: string[]
  created_at: string
}

export default function AIEmailWorkflow() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [leads, setLeads] = useState<Lead[]>([])
  const [materials, setMaterials] = useState<ProductMaterial[]>([])
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false)

  // 获取客户线索
  const fetchLeads = useCallback(async () => {
    if (!user) return

    try {
      // 首先尝试从customer_leads表获取数据
      let data, error
      try {
        const result = await supabase
          .from('customer_leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        data = result.data
        error = result.error
      } catch (e) {
        error = e
      }

      // 如果customer_leads表不存在，回退到leads表
      if (error && error.message.includes('relation "public.customer_leads" does not exist')) {
        console.log('customer_leads表不存在，回退到leads表')
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

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
          created_at: lead.created_at,
          updated_at: lead.updated_at || lead.created_at
        })) || []
      } else if (error) {
        throw error
      }

      setLeads(data || [])
    } catch (error) {
      console.error('获取客户线索失败:', error)
      showNotification('error', '加载失败', '无法获取客户线索')
    }
  }, [user, showNotification])

  // 状态和来源映射辅助函数
  const mapOldStatusToNew = (oldStatus: string): string => {
    switch (oldStatus) {
      case 'pending': return 'new'
      case 'processing': return 'contacted'
      case 'completed': return 'converted'
      case 'failed': return 'lost'
      default: return 'new'
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

  // 获取产品资料
  const fetchMaterials = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('product_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('获取产品资料失败:', error)
      showNotification('error', '加载失败', '无法获取产品资料')
    }
  }, [user, showNotification])

  useEffect(() => {
    fetchLeads()
    fetchMaterials()
  }, [fetchLeads, fetchMaterials])

  // 切换线索选择
  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  // 切换资料选择
  const toggleMaterialSelection = (materialId: string) => {
    const newSelected = new Set(selectedMaterials)
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId)
    } else {
      newSelected.add(materialId)
    }
    setSelectedMaterials(newSelected)
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

  // 获取来源颜色
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'manual': return 'bg-blue-100 text-blue-800'
      case 'excel_import': return 'bg-green-100 text-green-800'
      case 'scraped': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 步骤导航
  const steps = [
    { id: 1, name: '选择线索', description: '选择要发送邮件的客户线索' },
    { id: 2, name: '选择资料', description: '选择相关的产品资料' },
    { id: 3, name: '生成邮件', description: 'AI生成个性化邮件内容' }
  ]

  const canProceedToStep2 = selectedLeads.size > 0
  const canProceedToStep3 = selectedLeads.size > 0 && selectedMaterials.size > 0

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">AI邮件生成</h1>
        <p className="mt-1 text-sm text-gray-600">
          选择客户线索和产品资料，AI将为您生成个性化邮件内容
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                <div className="flex items-center">
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'border-2 border-gray-300 bg-white text-gray-500'
                  }`}>
                    {currentStep > step.id ? (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-4 min-w-0">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* 步骤内容 */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">选择客户线索</h2>
              <span className="text-sm text-gray-500">已选择 {selectedLeads.size} 个线索</span>
            </div>
            
            {leads.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无客户线索</h3>
                <p className="mt-1 text-sm text-gray-500">请先添加客户线索再使用AI邮件功能</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedLeads.has(lead.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleLeadSelection(lead.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{lead.customer_name}</h4>
                            <p className="text-sm text-gray-500">{lead.company_name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(lead.source)}`}>
                          {getSourceLabel(lead.source)}
                        </span>
                        <span className="text-sm text-gray-500">{lead.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步：选择资料
              <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">选择产品资料</h2>
              <span className="text-sm text-gray-500">已选择 {selectedMaterials.size} 个资料</span>
            </div>
            
            {materials.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无产品资料</h3>
                <p className="mt-1 text-sm text-gray-500">请先上传产品资料再使用AI邮件功能</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMaterials.has(material.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleMaterialSelection(material.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedMaterials.has(material.id)}
                            onChange={() => toggleMaterialSelection(material.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{material.file_name}</h4>
                            <p className="text-sm text-gray-500">
                              {material.file_type} • {(material.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {material.keywords.slice(0, 3).map((keyword, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {keyword}
                          </span>
                        ))}
                        {material.keywords.length > 3 && (
                          <span className="text-xs text-gray-500">+{material.keywords.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 -ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一步
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步：生成邮件
              <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">AI邮件生成</h2>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h3 className="mt-4 text-sm font-medium text-gray-900">正在生成个性化邮件...</h3>
              <p className="mt-1 text-sm text-gray-500">
                为 {selectedLeads.size} 个客户线索生成邮件，使用 {selectedMaterials.size} 个产品资料
              </p>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 -ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一步
            </button>
            <button
              disabled
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
            >
              生成中...
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
