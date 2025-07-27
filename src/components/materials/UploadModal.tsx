'use client'

import React, { useState, useRef } from 'react'
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useBatchUploadMaterialsMutation } from '@/hooks/useMaterialsQuery'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchUploadMutation = useBatchUploadMaterialsMutation()

  const handleFileSelect = (files: FileList) => {
    setSelectedFiles(files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
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
      handleFileSelect(files)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFiles || !user) {
      return
    }

    try {
      await batchUploadMutation.mutateAsync({
        files: selectedFiles,
        userId: user.id
      })

      // 上传成功后关闭模态框
      handleClose()
    } catch (error) {
      console.error('上传失败:', error)
      // 错误处理已在mutation中处理，这里不需要额外处理
    }
  }

  const handleClose = () => {
    setSelectedFiles(null)
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleClose}
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                上传产品资料
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
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {selectedFiles && selectedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <CloudArrowUpIcon className="w-12 h-12 text-green-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">
                      已选择 {selectedFiles.length} 个文件
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index}>
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedFiles(null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      重新选择
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm text-gray-600">
                        拖拽文件到此处，或
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          点击选择文件
                        </button>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        支持PDF、图片、视频等多种格式，单个文件最大50MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 描述输入 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  文件描述（可选）
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="请输入文件描述或备注信息..."
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
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
                disabled={!selectedFiles || selectedFiles.length === 0 || batchUploadMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {batchUploadMutation.isPending ? '上传中...' : '开始上传'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadModal
