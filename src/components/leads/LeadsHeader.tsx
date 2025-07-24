'use client'

import React, { useState } from 'react'
import { PlusIcon, DocumentArrowUpIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import AddLeadModal from './AddLeadModal'
import ImportLeadsModal from './ImportLeadsModal'

interface LeadsHeaderProps {
  onAddLead: (leadData: Record<string, unknown>) => void
  onImportLeads: (file: File) => void
  isAdding: boolean
  isImporting: boolean
}

const LeadsHeader: React.FC<LeadsHeaderProps> = ({
  onAddLead,
  onImportLeads,
  isAdding,
  isImporting
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const handleAddLead = (leadData: Record<string, unknown>) => {
    onAddLead(leadData)
    setShowAddModal(false)
  }

  const handleImportLeads = (file: File) => {
    onImportLeads(file)
    setShowImportModal(false)
  }

  const handleExportLeads = () => {
    // 导出功能实现
    const exportUrl = '/api/leads/export'
    const link = document.createElement('a')
    link.href = exportUrl
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户线索管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理和跟踪您的潜在客户，提高转化率
          </p>
        </div>
        
        <div className="flex space-x-3">
          {/* 导出按钮 */}
          <button
            onClick={handleExportLeads}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            导出
          </button>
          
          {/* 导入按钮 */}
          <button
            onClick={() => setShowImportModal(true)}
            disabled={isImporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
            {isImporting ? '导入中...' : '导入'}
          </button>
          
          {/* 添加线索按钮 */}
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isAdding}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            {isAdding ? '添加中...' : '添加线索'}
          </button>
        </div>
      </div>

      {/* 添加线索模态框 */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddLead}
        isLoading={isAdding}
      />

      {/* 导入线索模态框 */}
      <ImportLeadsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSubmit={handleImportLeads}
        isLoading={isImporting}
      />
    </>
  )
}

export default React.memo(LeadsHeader)
