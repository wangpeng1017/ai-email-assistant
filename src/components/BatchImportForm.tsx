'use client'

import { useState } from 'react'
import ExcelUploadForm from './ExcelUploadForm'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from './Notification'

interface LeadData {
  customer_name: string
  customer_email: string
  customer_website: string
}

interface BatchImportFormProps {
  onClose: () => void
  onSubmit: () => void
}

export default function BatchImportForm({ onClose, onSubmit }: BatchImportFormProps) {
  const [parsedLeads, setParsedLeads] = useState<LeadData[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { showNotification } = useNotification()

  const handleDataParsed = (leads: LeadData[]) => {
    setParsedLeads(leads)
  }

  const handleUploadStart = () => {
    setIsUploading(true)
  }

  const handleUploadComplete = () => {
    setIsUploading(false)
  }

  const handleSubmitBatch = async () => {
    if (parsedLeads.length === 0) {
      showNotification('error', '错误', '请先上传并解析Excel文件')
      return
    }

    if (!user) {
      showNotification('error', '错误', '请先登录')
      return
    }

    setIsSubmitting(true)

    try {
      // 批量提交线索数据
      const response = await fetch('/api/leads/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leads: parsedLeads.map(lead => ({
            ...lead,
            source: 'excel',
            status: 'pending'
          }))
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '批量导入失败')
      }

      const result = await response.json()

      showNotification(
        'success',
        '导入成功',
        `成功导入 ${result.imported} 条线索${result.skipped > 0 ? `，跳过 ${result.skipped} 条重复数据` : ''}`
      )

      onSubmit()
      onClose()

    } catch (error) {
      console.error('批量导入错误:', error)
      showNotification(
        'error',
        '导入失败',
        `批量导入失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Excel批量导入</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600">
          上传包含客户信息的Excel文件，系统将自动批量处理所有线索
        </p>
      </div>

      {/* Excel上传组件 */}
      <ExcelUploadForm
        onDataParsed={handleDataParsed}
        onUploadStart={handleUploadStart}
        onUploadComplete={handleUploadComplete}
      />

      {/* 操作按钮 */}
      <div className="flex space-x-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isUploading || isSubmitting}
          className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmitBatch}
          disabled={parsedLeads.length === 0 || isUploading || isSubmitting}
          className="flex-1 bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              导入中...
            </>
          ) : (
            `导入 ${parsedLeads.length} 条线索`
          )}
        </button>
      </div>
    </div>
  )
}
