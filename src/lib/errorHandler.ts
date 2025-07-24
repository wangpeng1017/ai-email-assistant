export interface AppError {
  message: string
  code?: string
  details?: string
}

export class CustomError extends Error {
  code?: string
  details?: string

  constructor(message: string, code?: string, details?: string) {
    super(message)
    this.name = 'CustomError'
    this.code = code
    this.details = details
  }
}

// 类型守卫和辅助类型
interface ErrorLike {
  message?: string
  code?: string
  stack?: string
  name?: string
  response?: {
    status: number
  }
}

export function handleApiError(error: unknown): AppError {
  console.error('API错误:', error)

  // 类型守卫：检查是否是Error对象
  const isError = error instanceof Error
  const errorObj = error as ErrorLike

  // 网络错误
  if (errorObj?.code === 'NETWORK_ERROR' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return {
      message: '网络连接失败，请检查网络连接后重试',
      code: 'NETWORK_ERROR'
    }
  }

  // Supabase错误
  if (errorObj?.code && errorObj?.message) {
    switch (errorObj.code) {
      case 'PGRST116':
        return {
          message: '数据不存在或已被删除',
          code: errorObj.code
        }
      case '23505':
        return {
          message: '数据已存在，请勿重复提交',
          code: errorObj.code
        }
      case '42501':
        return {
          message: '权限不足，请重新登录',
          code: errorObj.code
        }
      default:
        return {
          message: errorObj.message || '数据库操作失败',
          code: errorObj.code
        }
    }
  }

  // HTTP错误
  if (errorObj?.response) {
    const status = errorObj.response.status
    switch (status) {
      case 400:
        return {
          message: '请求参数错误，请检查输入信息',
          code: 'BAD_REQUEST'
        }
      case 401:
        return {
          message: '登录已过期，请重新登录',
          code: 'UNAUTHORIZED'
        }
      case 403:
        return {
          message: '权限不足，无法执行此操作',
          code: 'FORBIDDEN'
        }
      case 404:
        return {
          message: '请求的资源不存在',
          code: 'NOT_FOUND'
        }
      case 429:
        return {
          message: '请求过于频繁，请稍后再试',
          code: 'RATE_LIMITED'
        }
      case 500:
        return {
          message: '服务器内部错误，请稍后重试',
          code: 'INTERNAL_ERROR'
        }
      default:
        return {
          message: `请求失败 (${status})，请稍后重试`,
          code: 'HTTP_ERROR'
        }
    }
  }

  // 超时错误
  if (errorObj?.code === 'ECONNABORTED' || errorObj?.message?.includes('timeout')) {
    return {
      message: '请求超时，请检查网络连接后重试',
      code: 'TIMEOUT'
    }
  }

  // AI API错误
  if (errorObj?.message?.includes('API key') || errorObj?.message?.includes('quota')) {
    return {
      message: 'AI服务暂时不可用，请稍后重试',
      code: 'AI_SERVICE_ERROR'
    }
  }

  // 网页分析错误
  if (errorObj?.message?.includes('ENOTFOUND') || errorObj?.message?.includes('DNS')) {
    return {
      message: '无法访问指定网站，请检查网址是否正确',
      code: 'WEBSITE_NOT_FOUND'
    }
  }

  // 默认错误
  return {
    message: (isError ? error.message : String(error)) || '操作失败，请重试',
    code: 'UNKNOWN_ERROR',
    details: isError ? error.stack : undefined
  }
}

export function getErrorMessage(error: unknown): string {
  const appError = handleApiError(error)
  return appError.message
}

export function logError(error: unknown, context?: string): void
export function logError(message: string, error: unknown, context?: unknown): void
export function logError(errorOrMessage: unknown, contextOrError?: unknown, additionalContext?: unknown) {
  const timestamp = new Date().toISOString()

  let error: unknown
  let context: string | undefined
  let extraContext: unknown

  // 判断调用方式
  if (typeof errorOrMessage === 'string') {
    // 新的调用方式: logError(message, error, context)
    context = errorOrMessage
    error = contextOrError
    extraContext = additionalContext
  } else {
    // 旧的调用方式: logError(error, context)
    error = errorOrMessage
    context = typeof contextOrError === 'string' ? contextOrError : undefined
    extraContext = contextOrError
  }

  const isError = error instanceof Error
  const errorObj = error as ErrorLike

  const errorInfo = {
    timestamp,
    context,
    extraContext,
    error: {
      message: isError ? (error as Error).message : String(error),
      stack: isError ? (error as Error).stack : undefined,
      code: errorObj?.code,
      name: isError ? (error as Error).name : 'Unknown'
    }
  }

  console.error('错误日志:', errorInfo)

  // 在生产环境中，这里可以发送错误到监控服务
  // 例如：Sentry, LogRocket 等
}
