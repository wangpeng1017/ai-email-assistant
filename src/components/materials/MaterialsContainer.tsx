'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMaterialsQuery } from '@/hooks/useMaterialsQuery'
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

  const { data: materials, isLoading, error } = useMaterialsQuery(user?.id || '')

  // 处理文件上传
  const handleUpload = async (files: FileList): Promise<void> => {
    if (!user) {
      throw new Error('用户未登录')
    }

    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append('files', file)
    })
    formData.append('userId', user.id)

    const response = await fetch('/api/materials/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '上传失败')
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || '上传失败')
    }

    // 上传成功后可以刷新材料列表
    // 这里可以添加刷新逻辑或者使用React Query的invalidateQueries
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
        />
      )}
    </div>
  )
}

export default MaterialsContainer
