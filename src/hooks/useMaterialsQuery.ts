import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryOptions, handleQueryError, fetchMaterialsData } from '@/lib/queryClient'
import { useAppStore } from '@/stores/appStore'
import { useNotification } from '@/components/Notification'

// 材料列表查询Hook
export function useMaterialsQuery(userId: string) {
  const filters = useAppStore((state) => state.filters.materials)
  const pagination = useAppStore((state) => state.pagination.materials)
  const setLoading = useAppStore((state) => state.setLoading)
  const setError = useAppStore((state) => state.setError)
  
  const queryParams = {
    ...filters,
    page: pagination.page,
    limit: pagination.limit
  }
  
  const query = useQuery({
    queryKey: queryKeys.materials.list(queryParams),
    queryFn: () => fetchMaterialsData(userId, queryParams),
    ...queryOptions.standard,
    enabled: !!userId
  })

  // 处理查询状态变化
  React.useEffect(() => {
    if (query.isSuccess && query.data) {
      setLoading('materials', false)
      setError('materials', null)

      // 更新分页信息
      if (query.data.pagination) {
        useAppStore.getState().setPagination('materials', query.data.pagination)
      }
    }

    if (query.isError) {
      setLoading('materials', false)
      setError('materials', handleQueryError(query.error))
    }

    if (query.isLoading) {
      setLoading('materials', true)
    }
  }, [query.isSuccess, query.isError, query.isLoading, query.data, query.error, setLoading, setError])

  return query
}

// 上传材料变更Hook
export function useUploadMaterialMutation() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async ({ file, userId, description }: {
      file: File;
      userId: string;
      description?: string
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      if (description) {
        formData.append('description', description)
      }

      const response = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    }
  })

  // 处理变更状态变化
  React.useEffect(() => {
    if (mutation.isSuccess && mutation.data) {
      showSuccess('上传成功', '文件已成功上传')

      // 刷新数据
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    }

    if (mutation.isError) {
      showError('上传失败', handleQueryError(mutation.error))
    }
  }, [mutation.isSuccess, mutation.isError, mutation.data, mutation.error, showSuccess, showError, queryClient])

  return mutation
}

// 删除材料变更Hook
export function useDeleteMaterialMutation() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    }
  })

  // 处理变更状态变化
  React.useEffect(() => {
    if (mutation.isSuccess) {
      showSuccess('删除成功', '文件已成功删除')
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    }

    if (mutation.isError) {
      showError('删除失败', handleQueryError(mutation.error))
    }
  }, [mutation.isSuccess, mutation.isError, mutation.error, showSuccess, showError, queryClient])

  return mutation
}

// 下载材料Hook
export function useDownloadMaterialMutation() {
  const { showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/materials/download?id=${id}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'download'

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // 创建下载链接
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true, filename }
    }
  })

  // 处理错误
  React.useEffect(() => {
    if (mutation.isError) {
      showError('下载失败', handleQueryError(mutation.error))
    }
  }, [mutation.isError, mutation.error, showError])

  return mutation
}

// 批量上传材料Hook
export function useBatchUploadMaterialsMutation() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async ({ files, userId }: { files: FileList; userId: string }) => {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', userId)

        const response = await fetch('/api/materials/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`上传 ${file.name} 失败: ${response.statusText}`)
        }

        return response.json()
      })

      const results = await Promise.allSettled(uploadPromises)

      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.filter(result => result.status === 'rejected')

      return {
        successful,
        failed: failed.length,
        errors: failed.map(result =>
          result.status === 'rejected' ? result.reason.message : ''
        )
      }
    }
  })

  // 处理变更状态变化
  React.useEffect(() => {
    if (mutation.isSuccess && mutation.data) {
      if (mutation.data.successful > 0) {
        showSuccess('批量上传完成', `成功上传 ${mutation.data.successful} 个文件`)
      }

      if (mutation.data.failed > 0) {
        showError('部分上传失败', `${mutation.data.failed} 个文件上传失败`)
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    }

    if (mutation.isError) {
      showError('批量上传失败', handleQueryError(mutation.error))
    }
  }, [mutation.isSuccess, mutation.isError, mutation.data, mutation.error, showSuccess, showError, queryClient])

  return mutation
}

// 更新材料信息Hook
export function useUpdateMaterialMutation() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    }
  })

  // 处理变更状态变化
  React.useEffect(() => {
    if (mutation.isSuccess) {
      showSuccess('更新成功', '文件信息已成功更新')
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    }

    if (mutation.isError) {
      showError('更新失败', handleQueryError(mutation.error))
    }
  }, [mutation.isSuccess, mutation.isError, mutation.error, showSuccess, showError, queryClient])

  return mutation
}

// 组合Hook - 提供完整的材料管理功能
export function useMaterialsManagement(userId: string) {
  const materialsQuery = useMaterialsQuery(userId)
  const uploadMutation = useUploadMaterialMutation()
  const deleteMutation = useDeleteMaterialMutation()
  const downloadMutation = useDownloadMaterialMutation()
  const batchUploadMutation = useBatchUploadMaterialsMutation()
  const updateMutation = useUpdateMaterialMutation()
  
  return {
    // 查询状态
    materials: materialsQuery.data?.data || [],
    isLoading: materialsQuery.isLoading,
    error: materialsQuery.error,
    
    // 变更操作
    uploadMaterial: uploadMutation.mutate,
    deleteMaterial: deleteMutation.mutate,
    downloadMaterial: downloadMutation.mutate,
    batchUpload: batchUploadMutation.mutate,
    updateMaterial: updateMutation.mutate,
    
    // 变更状态
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDownloading: downloadMutation.isPending,
    isBatchUploading: batchUploadMutation.isPending,
    isUpdating: updateMutation.isPending,
    
    // 刷新数据
    refetch: materialsQuery.refetch
  }
}
