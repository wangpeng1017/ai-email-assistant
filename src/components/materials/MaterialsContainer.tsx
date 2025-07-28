'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMaterialsQuery, useBatchUploadMaterialsMutation } from '@/hooks/useMaterialsQuery'
import { useNotification } from '@/components/Notification'
import MaterialsHeader from './MaterialsHeader'
import MaterialsFilters from './MaterialsFilters'
import MaterialsGrid from './MaterialsGrid'
import MaterialsPagination from './MaterialsPagination'
import UploadModal from './UploadModal'
import MaterialsPageSkeleton from '@/components/skeletons/MaterialsSkeleton'

const MaterialsContainer: React.FC = () => {
  const { user } = useAuth()
  const [showUploadModal, setShowUploadModal] = React.useState(false)
  const { showError } = useNotification()

  const { data: materials, isLoading, error } = useMaterialsQuery(user?.id || '')
  const batchUploadMutation = useBatchUploadMaterialsMutation()

  // 处理文件上传 - 使用React Query mutation
  const handleUpload = async (files: FileList): Promise<void> => {
    if (!user) {
      throw new Error('用户未登录')
    }

    console.log(`开始批量上传 ${files.length} 个文件`)

    // 使用React Query的批量上传mutation，它会自动刷新数据
    return new Promise((resolve, reject) => {
      batchUploadMutation.mutate(
        { files, userId: user.id },
        {
          onSuccess: () => {
            console.log('批量上传成功')
            resolve()
          },
          onError: (error) => {
            console.error('批量上传失败:', error)
            reject(error)
          }
        }
      )
    })
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

      <div className="bg-white rounded-lg shadow border border-gray-200">
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
