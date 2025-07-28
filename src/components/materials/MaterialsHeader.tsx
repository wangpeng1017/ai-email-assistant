'use client'

import React from 'react'
import { CloudArrowUpIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

interface MaterialsHeaderProps {
  onUpload: () => void
}

const MaterialsHeader: React.FC<MaterialsHeaderProps> = ({ onUpload }) => {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">产品资料管理</h1>
        <p className="mt-2 text-sm text-gray-600">管理和组织您的产品资料文件</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onUpload}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
          >
            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
            上传文件
          </button>

          <button
            onClick={() => {
              // TODO: 实现批量操作
            }}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-sm"
          >
            <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
            批量操作
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(MaterialsHeader)
