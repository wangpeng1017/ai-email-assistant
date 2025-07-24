import { useState, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
}

export function useDataCache<T>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 50 } = options // Default 5 minutes TTL
  const cache = useRef(new Map<string, CacheEntry<T>>())
  const [isLoading, setIsLoading] = useState(false)

  const generateKey = useCallback((params: Record<string, unknown>): string => {
    return JSON.stringify(params, Object.keys(params).sort())
  }, [])

  const isExpired = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp > ttl
  }, [ttl])

  const cleanupExpired = useCallback(() => {
    const now = Date.now()
    for (const [key, entry] of cache.current.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.current.delete(key)
      }
    }
  }, [ttl])

  const evictOldest = useCallback(() => {
    if (cache.current.size >= maxSize) {
      const oldestKey = cache.current.keys().next().value
      if (oldestKey) {
        cache.current.delete(oldestKey)
      }
    }
  }, [maxSize])

  const get = useCallback((params: Record<string, unknown>): T | null => {
    const key = generateKey(params)
    const entry = cache.current.get(key)
    
    if (!entry || isExpired(entry)) {
      if (entry) {
        cache.current.delete(key)
      }
      return null
    }
    
    return entry.data
  }, [generateKey, isExpired])

  const set = useCallback((params: Record<string, unknown>, data: T) => {
    cleanupExpired()
    evictOldest()
    
    const key = generateKey(params)
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      key
    })
  }, [generateKey, cleanupExpired, evictOldest])

  const invalidate = useCallback((params?: Record<string, unknown>) => {
    if (params) {
      const key = generateKey(params)
      cache.current.delete(key)
    } else {
      cache.current.clear()
    }
  }, [generateKey])

  const fetchWithCache = useCallback(async <R>(
    params: Record<string, unknown>,
    fetcher: () => Promise<R>
  ): Promise<R> => {
    // Check cache first
    const cached = get(params) as R | null
    if (cached !== null) {
      console.log('Cache hit for:', params)
      return cached
    }

    // Cache miss, fetch data
    console.log('Cache miss for:', params)
    setIsLoading(true)
    try {
      const data = await fetcher()
      set(params, data as T)
      return data
    } finally {
      setIsLoading(false)
    }
  }, [get, set])

  const getCacheStats = useCallback(() => {
    return {
      size: cache.current.size,
      maxSize,
      ttl,
      entries: Array.from(cache.current.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        age: Date.now() - entry.timestamp,
        expired: isExpired(entry)
      }))
    }
  }, [maxSize, ttl, isExpired])

  return {
    get,
    set,
    invalidate,
    fetchWithCache,
    isLoading,
    getCacheStats
  }
}

// 专用的API缓存Hook
export function useApiCache() {
  return useDataCache({
    ttl: 2 * 60 * 1000, // 2分钟缓存
    maxSize: 20
  })
}

// 专用的数据库查询缓存Hook
export function useDbCache() {
  return useDataCache({
    ttl: 5 * 60 * 1000, // 5分钟缓存
    maxSize: 30
  })
}
