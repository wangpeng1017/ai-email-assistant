import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, queryOptions, handleQueryError, fetchLeadsData } from '@/lib/queryClient'
import { useAppStore } from '@/stores/appStore'
import { useNotification } from '@/components/Notification'

// 线索列表查询Hook
export function useLeadsQuery(userId: string) {
  const filters = useAppStore((state) => state.filters.leads)
  const pagination = useAppStore((state) => state.pagination.leads)
  const setLoading = useAppStore((state) => state.setLoading)
  const setError = useAppStore((state) => state.setError)
  
  const queryParams = {
    ...filters,
    page: pagination.page,
    limit: pagination.limit
  }
  
  const query = useQuery({
    queryKey: queryKeys.leads.list(queryParams),
    queryFn: () => fetchLeadsData(userId, queryParams),
    ...queryOptions.standard,
    enabled: !!userId
  })

  // 处理查询状态变化
  React.useEffect(() => {
    if (query.isSuccess && query.data) {
      setLoading('leads', false)
      setError('leads', null)

      // 更新分页信息
      if (query.data.pagination) {
        useAppStore.getState().setPagination('leads', query.data.pagination)
      }
    }

    if (query.isError) {
      setLoading('leads', false)
      setError('leads', handleQueryError(query.error))
    }

    if (query.isLoading) {
      setLoading('leads', true)
    }
  }, [query.isSuccess, query.isError, query.isLoading, query.data, query.error, setLoading, setError])

  return query
}

// 线索统计查询Hook
export function useLeadsStatsQuery(userId: string) {
  const setLoading = useAppStore((state) => state.setLoading)
  const setError = useAppStore((state) => state.setError)
  const setStats = useAppStore((state) => state.setStats)
  
  const query = useQuery({
    queryKey: queryKeys.leads.stats(userId),
    queryFn: async () => {
      const response = await fetch(`/api/leads/stats?userId=${userId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    },
    ...queryOptions.fast,
    enabled: !!userId
  })

  // 处理查询状态变化
  React.useEffect(() => {
    if (query.isSuccess && query.data) {
      setLoading('stats', false)
      setError('stats', null)
      setStats(query.data.stats)
    }

    if (query.isError) {
      setLoading('stats', false)
      setError('stats', handleQueryError(query.error))
    }

    if (query.isLoading) {
      setLoading('stats', true)
    }
  }, [query.isSuccess, query.isError, query.isLoading, query.data, query.error, setLoading, setError, setStats])

  return query
}

// 添加线索变更Hook
export function useAddLeadMutation(userId: string) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async (leadData: Record<string, unknown>) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
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
      showSuccess('添加成功', '客户线索已成功添加')

      // 刷新数据
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(userId) })
    }

    if (mutation.isError) {
      showError('添加失败', handleQueryError(mutation.error))
    }
  }, [mutation.isSuccess, mutation.isError, mutation.data, mutation.error, showSuccess, showError, queryClient, userId])

  return mutation
}

// 更新线索变更Hook
export function useUpdateLeadMutation(userId: string) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const response = await fetch(`/api/leads/${id}`, {
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
      showSuccess('更新成功', '客户线索已成功更新')

      // 刷新数据
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(userId) })
    }

    if (mutation.isError) {
      showError('更新失败', handleQueryError(mutation.error))
    }
  }, [mutation.isSuccess, mutation.isError, mutation.error, showSuccess, showError, queryClient, userId])

  return mutation
}

// 删除线索变更Hook
export function useDeleteLeadMutation(userId: string) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leads/${id}`, {
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
      showSuccess('删除成功', '客户线索已成功删除')

      // 刷新数据
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(userId) })
    }

    if (mutation.isError) {
      showError('删除失败', handleQueryError(mutation.error))
    }
  }, [mutation.isSuccess, mutation.isError, mutation.error, showSuccess, showError, queryClient, userId])

  return mutation
}

// 批量导入线索Hook
export function useImportLeadsMutation(userId: string) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/leads/import', {
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
      showSuccess('导入成功', `成功导入 ${mutation.data.count} 条客户线索`)

      // 刷新数据
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(userId) })
    }

    if (mutation.isError) {
      showError('导入失败', handleQueryError(mutation.error))
    }
  }, [mutation.isSuccess, mutation.isError, mutation.data, mutation.error, showSuccess, showError, queryClient, userId])

  return mutation
}

// 组合Hook - 提供完整的线索管理功能
export function useLeadsManagement(userId: string) {
  const leadsQuery = useLeadsQuery(userId)
  const statsQuery = useLeadsStatsQuery(userId)
  const addMutation = useAddLeadMutation(userId)
  const updateMutation = useUpdateLeadMutation(userId)
  const deleteMutation = useDeleteLeadMutation(userId)
  const importMutation = useImportLeadsMutation(userId)

  return {
    // 查询状态
    leads: leadsQuery.data?.data || [],
    stats: statsQuery.data?.stats || null,
    isLoading: leadsQuery.isLoading || statsQuery.isLoading,
    error: leadsQuery.error || statsQuery.error,

    // 变更操作
    addLead: addMutation.mutate,
    updateLead: updateMutation.mutate,
    deleteLead: deleteMutation.mutate,
    importLeads: importMutation.mutate,

    // 变更状态
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isImporting: importMutation.isPending,

    // 刷新数据
    refetch: () => {
      leadsQuery.refetch()
      statsQuery.refetch()
    }
  }
}
