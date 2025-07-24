// 优化的API客户端，包含缓存、重试和性能监控

interface ApiClientOptions {
  baseUrl?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  enableCache?: boolean
  cacheTimeout?: number
}

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  skipCache?: boolean
}

interface CachedResponse {
  data: unknown
  timestamp: number
  url: string
}

class OptimizedApiClient {
  private baseUrl: string
  private timeout: number
  private retries: number
  private retryDelay: number
  private enableCache: boolean
  private cacheTimeout: number
  private cache: Map<string, CachedResponse>
  private requestQueue: Map<string, Promise<unknown>>

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || ''
    this.timeout = options.timeout || 10000 // 10秒超时
    this.retries = options.retries || 2
    this.retryDelay = options.retryDelay || 1000
    this.enableCache = options.enableCache ?? true
    this.cacheTimeout = options.cacheTimeout || 2 * 60 * 1000 // 2分钟缓存
    this.cache = new Map()
    this.requestQueue = new Map()
  }

  private generateCacheKey(url: string, options: RequestOptions): string {
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  private isValidCachedResponse(cached: CachedResponse): boolean {
    return Date.now() - cached.timestamp < this.cacheTimeout
  }

  private async fetchWithTimeout(url: string, options: RequestOptions): Promise<Response> {
    const timeout = options.timeout || this.timeout
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async fetchWithRetry(url: string, options: RequestOptions): Promise<Response> {
    const maxRetries = options.retries ?? this.retries
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 API Request (attempt ${attempt + 1}/${maxRetries + 1}): ${options.method || 'GET'} ${url}`)
        const startTime = performance.now()
        
        const response = await this.fetchWithTimeout(url, options)
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        console.log(`✅ API Response: ${response.status} ${response.statusText} (${duration.toFixed(2)}ms)`)
        
        if (response.ok) {
          return response
        }
        
        // 对于4xx错误，不重试
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        // 对于5xx错误，继续重试
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        
      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ API Request failed (attempt ${attempt + 1}):`, error)
        
        // 如果是最后一次尝试，抛出错误
        if (attempt === maxRetries) {
          break
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)))
      }
    }
    
    throw lastError!
  }

  async request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`
    const method = options.method || 'GET'
    
    // 生成缓存键
    const cacheKey = this.generateCacheKey(fullUrl, options)
    
    // 检查缓存（仅对GET请求且未跳过缓存）
    if (this.enableCache && method === 'GET' && !options.skipCache) {
      const cached = this.cache.get(cacheKey)
      if (cached && this.isValidCachedResponse(cached)) {
        console.log(`📦 Cache hit for: ${fullUrl}`)
        return cached.data as T
      }
    }
    
    // 检查是否有相同的请求正在进行（防止重复请求）
    if (this.requestQueue.has(cacheKey)) {
      console.log(`⏳ Request already in progress, waiting: ${fullUrl}`)
      return this.requestQueue.get(cacheKey)! as Promise<T>
    }
    
    // 创建请求Promise
    const requestPromise = this.executeRequest<T>(fullUrl, options, cacheKey)
    
    // 将请求添加到队列
    this.requestQueue.set(cacheKey, requestPromise)
    
    try {
      const result = await requestPromise
      return result
    } finally {
      // 请求完成后从队列中移除
      this.requestQueue.delete(cacheKey)
    }
  }

  private async executeRequest<T>(fullUrl: string, options: RequestOptions, cacheKey: string): Promise<T> {
    try {
      const response = await this.fetchWithRetry(fullUrl, options)
      
      let data: T
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text() as T
      }
      
      // 缓存成功的GET请求响应
      if (this.enableCache && (options.method || 'GET') === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          url: fullUrl
        })
        console.log(`💾 Cached response for: ${fullUrl}`)
      }
      
      return data
      
    } catch (error) {
      console.error(`❌ API Request failed: ${fullUrl}`, error)
      throw error
    }
  }

  // 便捷方法
  async get<T = unknown>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  async post<T = unknown>(url: string, data?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }

  async put<T = unknown>(url: string, data?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }

  async delete<T = unknown>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }

  // 缓存管理
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ API cache cleared')
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.clearCache()
      return
    }

    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
    console.log(`🗑️ Cache invalidated for pattern: ${pattern}`)
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        url: value.url,
        age: Date.now() - value.timestamp,
        expired: !this.isValidCachedResponse(value)
      }))
    }
  }
}

// 创建默认实例
export const apiClient = new OptimizedApiClient({
  timeout: 8000, // 8秒超时
  retries: 2,
  retryDelay: 1000,
  enableCache: true,
  cacheTimeout: 2 * 60 * 1000 // 2分钟缓存
})

export default OptimizedApiClient
