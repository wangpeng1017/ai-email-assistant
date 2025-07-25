import { QueryClient } from '@tanstack/react-query'

// 创建全局查询客户端
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 缓存时间：数据在内存中保留的时间
      gcTime: 10 * 60 * 1000, // 10分钟
      // 数据新鲜度：数据被认为是新鲜的时间
      staleTime: 5 * 60 * 1000, // 5分钟
      // 重试配置
      retry: (failureCount, error) => {
        // 对于4xx错误不重试，对于网络错误重试最多3次
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口聚焦时不自动重新获取
      refetchOnWindowFocus: false,
      // 网络重连时重新获取
      refetchOnReconnect: true,
      // 组件挂载时不自动重新获取（除非数据过期）
      refetchOnMount: true
    },
    mutations: {
      // 变更重试配置
      retry: 1,
      retryDelay: 1000
    }
  }
})

// 查询键工厂 - 统一管理查询键
export const queryKeys = {
  // 用户相关
  user: ['user'] as const,
  
  // 线索相关
  leads: {
    all: ['leads'] as const,
    list: (filters?: Record<string, unknown>) => ['leads', 'list', filters] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
    stats: (userId: string) => ['leads', 'stats', userId] as const
  },
  
  // 材料相关
  materials: {
    all: ['materials'] as const,
    list: (filters?: Record<string, unknown>) => ['materials', 'list', filters] as const,
    detail: (id: string) => ['materials', 'detail', id] as const
  },
  
  // Gmail相关
  gmail: {
    authStatus: ['gmail', 'auth-status'] as const,
    drafts: ['gmail', 'drafts'] as const
  }
} as const

// 预定义的查询选项
export const queryOptions = {
  // 快速缓存 - 用于频繁访问的数据
  fast: {
    staleTime: 30 * 1000, // 30秒
    gcTime: 2 * 60 * 1000 // 2分钟
  },
  
  // 标准缓存 - 默认配置
  standard: {
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000 // 10分钟
  },
  
  // 长期缓存 - 用于不经常变化的数据
  long: {
    staleTime: 30 * 60 * 1000, // 30分钟
    gcTime: 60 * 60 * 1000 // 1小时
  },
  
  // 实时数据 - 总是重新获取
  realtime: {
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30 * 1000 // 30秒轮询
  }
}

// 错误处理工具
export const handleQueryError = (error: unknown): string => {
  if (error instanceof Error) {
    // 网络错误
    if (error.message.includes('fetch')) {
      return '网络连接失败，请检查网络连接'
    }
    
    // API错误
    if (error.message.includes('400')) {
      return '请求参数错误'
    }
    
    if (error.message.includes('401')) {
      return '身份验证失败，请重新登录'
    }
    
    if (error.message.includes('403')) {
      return '权限不足'
    }
    
    if (error.message.includes('404')) {
      return '请求的资源不存在'
    }
    
    if (error.message.includes('500')) {
      return '服务器内部错误'
    }
    
    return error.message
  }
  
  return '未知错误'
}

// 缓存管理工具
export const cacheUtils = {
  // 清除所有缓存
  clearAll: () => {
    queryClient.clear()
  },
  
  // 清除特定类型的缓存
  clearLeads: () => {
    queryClient.removeQueries({ queryKey: queryKeys.leads.all })
  },
  
  clearMaterials: () => {
    queryClient.removeQueries({ queryKey: queryKeys.materials.all })
  },
  
  // 预加载数据
  prefetchLeads: async (userId: string, filters?: Record<string, unknown>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.leads.list(filters),
      queryFn: () => fetchLeadsData(userId, filters)
    })
  },
  
  prefetchMaterials: async (userId: string, filters?: Record<string, unknown>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.materials.list(filters),
      queryFn: () => fetchMaterialsData(userId, filters)
    })
  },
  
  // 手动更新缓存
  updateLeadInCache: (leadId: string, updates: Record<string, unknown>) => {
    queryClient.setQueriesData(
      { queryKey: queryKeys.leads.all },
      (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object' || !('data' in oldData)) return oldData

        const typedData = oldData as { data: Array<Record<string, unknown>> }

        return {
          ...typedData,
          data: typedData.data.map((lead: Record<string, unknown>) =>
            lead.id === leadId ? { ...lead, ...updates } : lead
          )
        }
      }
    )
  },
  
  // 乐观更新
  optimisticUpdate: <T>(
    queryKey: readonly unknown[],
    updater: (oldData: T) => T
  ) => {
    const previousData = queryClient.getQueryData<T>(queryKey)
    
    if (previousData) {
      queryClient.setQueryData(queryKey, updater(previousData))
    }
    
    return () => {
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData)
      }
    }
  }
}

// 数据获取函数（将在hooks中使用）
async function fetchLeadsData(userId: string, filters?: Record<string, unknown>) {
  const params = new URLSearchParams({
    userId,
    ...Object.fromEntries(
      Object.entries(filters || {}).map(([key, value]) => [key, String(value)])
    )
  })
  
  const response = await fetch(`/api/leads?${params}`)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

async function fetchMaterialsData(userId: string, filters?: Record<string, unknown>) {
  const params = new URLSearchParams({
    userId,
    ...Object.fromEntries(
      Object.entries(filters || {}).map(([key, value]) => [key, String(value)])
    )
  })

  const response = await fetch(`/api/materials?${params}`)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// 导出数据获取函数供hooks使用
export { fetchLeadsData, fetchMaterialsData }
