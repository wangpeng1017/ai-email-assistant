'use client'

import React from 'react'
import { CloudArrowUpIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

interface MaterialsHeaderProps {
  onUpload: () => void
}

const MaterialsHeader: React.FC<MaterialsHeaderProps> = ({ onUpload }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">产品资料管理</h1>
        <p className="text-gray-600 mt-1">
          管理和组织您的产品资料文件，支持多种格式上传和智能分类
        </p>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={onUpload}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <CloudArrowUpIcon className="w-4 h-4 mr-2" />
          上传文件
        </button>
        
        <button
          onClick={() => {
            // TODO: 实现批量操作
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
          批量操作
        </button>
      </div>
    </div>
  )
}

export default React.memo(MaterialsHeader)
