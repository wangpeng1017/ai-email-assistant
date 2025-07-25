'use client'

import React, { useState, useRef } from 'react'
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'

interface ImportLeadsModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (file: File) => void
  isLoading: boolean
}

const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setSelectedFile(file)
    } else {
      alert('请选择CSV文件')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile)
      setSelectedFile(null)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                导入客户线索
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 文件上传区域 */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <DocumentArrowUpIcon className="w-12 h-12 text-green-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      移除文件
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm text-gray-600">
                        拖拽CSV文件到此处，或
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          点击选择文件
                        </button>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        支持CSV格式，最大10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* CSV格式说明 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  CSV文件格式要求：
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 第一行为标题行：customer_name, customer_email, customer_website, source, status</li>
                  <li>• customer_name 和 customer_email 为必填字段</li>
                  <li>• source 可选值：website, social_media, email_campaign, referral, advertisement, other</li>
                  <li>• status 可选值：pending, processing, completed, failed</li>
                </ul>
              </div>
              
              {/* 示例下载 */}
              <div className="text-center">
                <button
                  onClick={() => {
                    const csvContent = 'customer_name,customer_email,customer_website,source,status\n张三,zhangsan@example.com,https://example.com,website,pending\n李四,lisi@example.com,,social_media,processing'
                    const blob = new Blob([csvContent], { type: 'text/csv' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'leads_template.csv'
                    a.click()
                    window.URL.revokeObjectURL(url)
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  下载CSV模板文件
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || isLoading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '导入中...' : '开始导入'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportLeadsModal
