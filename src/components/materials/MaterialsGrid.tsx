'use client'

import React from 'react'
import { DocumentIcon, PhotoIcon, VideoCameraIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'

interface Material {
  id: string
  file_name: string
  file_type: string
  file_size: number
  description?: string
  created_at: string
  storage_path: string
}

interface MaterialsGridProps {
  materials: Material[]
}

const MaterialsGrid: React.FC<MaterialsGridProps> = ({ materials }) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return PhotoIcon
    if (fileType.startsWith('video/')) return VideoCameraIcon
    if (fileType === 'application/pdf') return DocumentIcon
    return ArchiveBoxIcon
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无文件</h3>
        <p className="mt-1 text-sm text-gray-500">
          开始上传您的第一个产品资料文件
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {materials.map((material) => {
          const FileIcon = getFileIcon(material.file_type)
          
          return (
            <div
              key={material.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <FileIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {material.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(material.file_size)}
                  </p>
                </div>
              </div>
              
              {material.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {material.description}
                </p>
              )}
              
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDate(material.created_at)}
                </span>
                
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: 实现下载功能
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    下载
                  </button>
                  <span className="text-xs text-gray-300">|</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: 实现删除功能
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(MaterialsGrid)
