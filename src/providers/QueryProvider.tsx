'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// 创建查询客户端的工厂函数
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 缓存时间：数据在内存中保留的时间
        gcTime: 10 * 60 * 1000, // 10分钟
        // 数据新鲜度：数据被认为是新鲜的时间
        staleTime: 5 * 60 * 1000, // 5分钟
        // 重试配置
        retry: (failureCount, error) => {
          // 对于4xx错误不重试，对于网络错误重试最多3次
          if (error instanceof Error) {
            // 检查是否是客户端错误（4xx）
            if (error.message.includes('400') || 
                error.message.includes('401') || 
                error.message.includes('403') || 
                error.message.includes('404')) {
              return false
            }
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
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // 服务器端：总是创建新的查询客户端
    return makeQueryClient()
  } else {
    // 浏览器端：如果没有现有客户端，则创建新的
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

interface QueryProviderProps {
  children: React.ReactNode
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // 注意：不要在这里使用useState，因为这会在服务器和客户端之间创建不匹配
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 只在开发环境中显示开发工具 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}

// 用于预加载数据的组件
interface PrefetchProviderProps {
  children: React.ReactNode
  prefetchQueries?: Array<{
    queryKey: readonly unknown[]
    queryFn: () => Promise<unknown>
  }>
}

export function PrefetchProvider({ children, prefetchQueries = [] }: PrefetchProviderProps) {
  const [queryClient] = useState(() => {
    const client = makeQueryClient()
    
    // 预加载查询
    prefetchQueries.forEach(({ queryKey, queryFn }) => {
      client.prefetchQuery({
        queryKey,
        queryFn
      })
    })
    
    return client
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}

// 错误边界组件，用于处理查询错误
interface QueryErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

class QueryErrorBoundary extends React.Component<
  QueryErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: QueryErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Query Error Boundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                数据加载出错
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                抱歉，数据加载时遇到了问题。请尝试刷新页面或联系技术支持。
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={this.resetError}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  重试
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  刷新页面
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 组合Provider，包含查询客户端和错误边界
interface AppQueryProviderProps {
  children: React.ReactNode
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export function AppQueryProvider({ children, errorFallback }: AppQueryProviderProps) {
  return (
    <QueryProvider>
      <QueryErrorBoundary fallback={errorFallback}>
        {children}
      </QueryErrorBoundary>
    </QueryProvider>
  )
}

// 导出查询客户端实例（用于在组件外部使用）
export { getQueryClient }

// 用于在服务器端预加载数据的工具函数
export async function prefetchServerData(
  queries: Array<{
    queryKey: readonly unknown[]
    queryFn: () => Promise<unknown>
  }>
) {
  const queryClient = makeQueryClient()
  
  await Promise.all(
    queries.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn
      })
    )
  )
  
  return queryClient
}

// 用于清理查询缓存的工具函数
export function clearQueryCache(patterns?: string[]) {
  const queryClient = getQueryClient()
  
  if (!patterns || patterns.length === 0) {
    queryClient.clear()
    return
  }
  
  patterns.forEach(pattern => {
    queryClient.removeQueries({
      predicate: (query) => {
        return query.queryKey.some(key => 
          typeof key === 'string' && key.includes(pattern)
        )
      }
    })
  })
}
