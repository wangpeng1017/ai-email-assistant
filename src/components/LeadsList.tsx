'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import EmailPreviewModal from './EmailPreviewModal'

type Lead = Database['public']['Tables']['leads']['Row']

export default function LeadsList() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingLeads, setProcessingLeads] = useState<Set<string>>(new Set())
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const fetchLeads = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setLeads(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    // 设置定时刷新，检查处理状态
    const interval = setInterval(() => {
      if (leads.some(lead => lead.status === 'processing')) {
        fetchLeads()
      }
    }, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }, [leads, fetchLeads])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待处理'
      case 'processing':
        return '处理中'
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const handleProcessSingle = async (leadId: string) => {
    try {
      setProcessingLeads(prev => new Set(prev).add(leadId))

      const response = await fetch('/api/automation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId }),
      })

      const result = await response.json()

      if (response.ok) {
        // 刷新列表
        fetchLeads()
      } else {
        alert(`处理失败：${result.error}`)
      }
    } catch (error) {
      alert('处理失败，请重试')
      console.error('处理单个线索失败:', error)
    } finally {
      setProcessingLeads(prev => {
        const newSet = new Set(prev)
        newSet.delete(leadId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-8">
        {error}
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无客户线索，请添加新的线索
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {leads.map((lead) => (
          <li key={lead.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lead.customer_name}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {getStatusText(lead.status)}
                  </span>
                </div>
                <div className="mt-1">
                  <p className="text-sm text-gray-600">
                    {lead.customer_email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {lead.customer_website}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span>创建时间：{formatDate(lead.created_at)}</span>
                  <span className="mx-2">•</span>
                  <span>来源：{lead.source === 'manual' ? '手动输入' : lead.source}</span>
                </div>
                {lead.error_message && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    错误：{lead.error_message}
                  </div>
                )}
                {lead.generated_mail_subject && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">邮件标题：</p>
                    <p className="text-sm text-gray-600">{lead.generated_mail_subject}</p>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex space-x-2">
                {lead.status === 'pending' && (
                  <button
                    onClick={() => handleProcessSingle(lead.id)}
                    disabled={processingLeads.has(lead.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingLeads.has(lead.id) ? '处理中...' : '立即处理'}
                  </button>
                )}
                {lead.status === 'processing' && (
                  <div className="flex items-center text-blue-600 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    处理中...
                  </div>
                )}
                {lead.status === 'completed' && lead.generated_mail_body && (
                  <button
                    onClick={() => {
                      setSelectedLead(lead)
                      setShowEmailModal(true)
                    }}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    查看邮件
                  </button>
                )}
                {lead.status === 'failed' && (
                  <button
                    onClick={() => handleProcessSingle(lead.id)}
                    disabled={processingLeads.has(lead.id)}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingLeads.has(lead.id) ? '重试中...' : '重试'}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* 邮件预览模态框 */}
      {selectedLead && (
        <EmailPreviewModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false)
            setSelectedLead(null)
          }}
          subject={selectedLead.generated_mail_subject || ''}
          body={selectedLead.generated_mail_body || ''}
          customerName={selectedLead.customer_name || ''}
          customerEmail={selectedLead.customer_email || ''}
        />
      )}
    </div>
  )
}
