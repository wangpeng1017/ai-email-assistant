'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMaterialsQuery } from '@/hooks/useMaterialsQuery'
import { useNotification } from '@/components/Notification'
import MaterialsHeader from './MaterialsHeader'
import MaterialsStats from './MaterialsStats'
import MaterialsFilters from './MaterialsFilters'
import MaterialsGrid from './MaterialsGrid'
import MaterialsPagination from './MaterialsPagination'
import UploadModal from './UploadModal'
import MaterialsPageSkeleton from '@/components/skeletons/MaterialsSkeleton'

const MaterialsContainer: React.FC = () => {
  const { user } = useAuth()
  const [showUploadModal, setShowUploadModal] = React.useState(false)
  const { showSuccess, showError } = useNotification()

  const { data: materials, isLoading, error } = useMaterialsQuery(user?.id || '')

  // 处理文件上传 - 支持多文件逐个上传
  const handleUpload = async (files: FileList): Promise<void> => {
    if (!user) {
      throw new Error('用户未登录')
    }

    console.log(`开始上传 ${files.length} 个文件`)

    // 逐个上传文件，因为API只支持单文件上传
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`上传文件 ${i + 1}/${files.length}: ${file.name}`)

      const formData = new FormData()
      formData.append('file', file)  // 使用 'file' 而不是 'files'
      formData.append('userId', user.id)
      formData.append('description', '') // 添加空描述

      const response = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`文件 ${file.name} 上传失败:`, errorData)
        throw new Error(`文件 ${file.name} 上传失败: ${errorData.error || '未知错误'}`)
      }

      const result = await response.json()
      if (!result.success) {
        console.error(`文件 ${file.name} 上传失败:`, result)
        throw new Error(`文件 ${file.name} 上传失败: ${result.error || '未知错误'}`)
      }

      console.log(`文件 ${file.name} 上传成功`)
    }

    console.log('所有文件上传完成')
    showSuccess('上传成功', `成功上传 ${files.length} 个文件`)
    // 上传成功后可以刷新材料列表
    // 这里可以添加刷新逻辑或者使用React Query的invalidateQueries
  }

  // 处理上传错误
  const handleUploadError = (message: string) => {
    showError('上传失败', message)
  }

  if (isLoading) {
    return <MaterialsPageSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600 mb-4">
            {error.message || '获取产品资料数据时发生错误'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <MaterialsHeader onUpload={() => setShowUploadModal(true)} />
      
      <MaterialsStats />
      
      <div className="bg-white rounded-lg shadow">
        <MaterialsFilters />
        
        <MaterialsGrid 
          materials={materials?.data || []}
        />
        
        <MaterialsPagination />
      </div>

      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          onError={handleUploadError}
        />
      )}
    </div>
  )
}

export default MaterialsContainer
