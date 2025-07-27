'use client'

import { useState, useRef, useCallback } from 'react'
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: FileList) => Promise<void>
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 重置状态
  const resetState = useCallback(() => {
    setSelectedFiles(null)
    setDragActive(false)
    setUploading(false)
    setUploadProgress(0)
  }, [])

  // 关闭模态框
  const handleClose = useCallback(() => {
    if (!uploading) {
      resetState()
      onClose()
    }
  }, [uploading, resetState, onClose])

  // 文件选择处理
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFiles(files)
    }
  }, [])

  // 点击选择文件
  const handleFileButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fileInputRef.current?.click()
  }, [])

  // 文件输入变化
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  // 拖拽处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [handleFileSelect])

  // 开始上传
  const handleStartUpload = useCallback(async () => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onUpload(selectedFiles)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // 上传成功后短暂显示完成状态，然后关闭
      setTimeout(() => {
        handleClose()
      }, 1000)
    } catch (error) {
      console.error('上传失败:', error)
      setUploading(false)
      setUploadProgress(0)
    }
  }, [selectedFiles, onUpload, handleClose])

  // 移除文件
  const handleRemoveFiles = useCallback(() => {
    setSelectedFiles(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 - 点击关闭 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* 模态框容器 */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* 模态框内容 - 阻止事件冒泡 */}
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              上传产品资料
            </h3>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-6">
            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* 文件上传区域 */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleFileButtonClick}
            >
              {selectedFiles && selectedFiles.length > 0 ? (
                // 已选择文件显示
                <div className="space-y-4">
                  <DocumentIcon className="w-12 h-12 text-green-600 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      已选择 {selectedFiles.length} 个文件
                    </p>
                    <div className="mt-2 space-y-1">
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          {file.name} ({formatFileSize(file.size)})
                        </div>
                      ))}
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFiles()
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      重新选择
                    </button>
                  )}
                </div>
              ) : (
                // 文件选择提示
                <div className="space-y-4">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600">
                      拖拽文件到此处，或
                      <span className="text-blue-600 hover:text-blue-800 ml-1">
                        点击选择文件
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      支持 PDF、Word、图片、视频等格式，单个文件最大 50MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 上传进度 */}
            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>上传中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 文件描述输入 */}
            {selectedFiles && selectedFiles.length > 0 && !uploading && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文件描述（可选）
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="为这些文件添加描述..."
                />
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleStartUpload}
              disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '上传中...' : '开始上传'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
