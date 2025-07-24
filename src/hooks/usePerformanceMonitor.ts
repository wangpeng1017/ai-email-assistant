import { useCallback, useRef, useState } from 'react'

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, unknown>
}

interface PerformanceStats {
  totalRequests: number
  averageResponseTime: number
  slowestRequest: PerformanceMetric | null
  fastestRequest: PerformanceMetric | null
  recentMetrics: PerformanceMetric[]
}

export function usePerformanceMonitor() {
  const metrics = useRef<PerformanceMetric[]>([])
  const [isMonitoring] = useState(false)

  const startTimer = useCallback((name: string, metadata?: Record<string, unknown>): string => {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const metric: PerformanceMetric = {
      name: id,
      startTime: performance.now(),
      metadata
    }
    
    metrics.current.push(metric)
    console.log(`⏱️ Performance: Started ${name}`, metadata)
    
    return id
  }, [])

  const endTimer = useCallback((id: string): number => {
    const metric = metrics.current.find(m => m.name === id)
    if (!metric) {
      console.warn(`Performance: Timer ${id} not found`)
      return 0
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    
    const originalName = id.split('_')[0]
    console.log(`⏱️ Performance: ${originalName} completed in ${metric.duration.toFixed(2)}ms`, metric.metadata)
    
    return metric.duration
  }, [])

  const measureAsync = useCallback(async <T>(
    name: string,
    asyncFn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> => {
    const id = startTimer(name, metadata)
    try {
      const result = await asyncFn()
      endTimer(id)
      return result
    } catch (error) {
      endTimer(id)
      console.error(`Performance: ${name} failed`, error)
      throw error
    }
  }, [startTimer, endTimer])

  const measureSync = useCallback(<T>(
    name: string,
    syncFn: () => T,
    metadata?: Record<string, unknown>
  ): T => {
    const id = startTimer(name, metadata)
    try {
      const result = syncFn()
      endTimer(id)
      return result
    } catch (error) {
      endTimer(id)
      console.error(`Performance: ${name} failed`, error)
      throw error
    }
  }, [startTimer, endTimer])

  const getStats = useCallback((): PerformanceStats => {
    const completedMetrics = metrics.current.filter(m => m.duration !== undefined)
    
    if (completedMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestRequest: null,
        fastestRequest: null,
        recentMetrics: []
      }
    }

    const durations = completedMetrics.map(m => m.duration!)
    const totalTime = durations.reduce((sum, duration) => sum + duration, 0)
    const averageResponseTime = totalTime / durations.length

    const slowestRequest = completedMetrics.reduce((slowest, current) => 
      !slowest || current.duration! > slowest.duration! ? current : slowest
    )

    const fastestRequest = completedMetrics.reduce((fastest, current) => 
      !fastest || current.duration! < fastest.duration! ? current : fastest
    )

    // Get recent metrics (last 10)
    const recentMetrics = completedMetrics.slice(-10)

    return {
      totalRequests: completedMetrics.length,
      averageResponseTime,
      slowestRequest,
      fastestRequest,
      recentMetrics
    }
  }, [])

  const clearMetrics = useCallback(() => {
    metrics.current = []
    console.log('Performance: Metrics cleared')
  }, [])

  const logStats = useCallback(() => {
    const stats = getStats()
    console.group('📊 Performance Statistics')
    console.log(`Total Requests: ${stats.totalRequests}`)
    console.log(`Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`)
    if (stats.slowestRequest) {
      console.log(`Slowest Request: ${stats.slowestRequest.name} (${stats.slowestRequest.duration!.toFixed(2)}ms)`)
    }
    if (stats.fastestRequest) {
      console.log(`Fastest Request: ${stats.fastestRequest.name} (${stats.fastestRequest.duration!.toFixed(2)}ms)`)
    }
    console.groupEnd()
  }, [getStats])

  // 页面加载性能监控
  const measurePageLoad = useCallback((pageName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: 0,
        timeToInteractive: navigation.domInteractive - navigation.fetchStart
      }

      // 尝试获取FCP
      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        metrics.firstContentfulPaint = fcpEntry.startTime
      }

      console.group(`📄 Page Load Performance: ${pageName}`)
      console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`)
      console.log(`Load Complete: ${metrics.loadComplete.toFixed(2)}ms`)
      console.log(`Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms`)
      if (metrics.firstContentfulPaint > 0) {
        console.log(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`)
      }
      console.groupEnd()

      return metrics
    }
    return null
  }, [])

  return {
    startTimer,
    endTimer,
    measureAsync,
    measureSync,
    getStats,
    clearMetrics,
    logStats,
    measurePageLoad,
    isMonitoring
  }
}

// 专用的API性能监控Hook
export function useApiPerformanceMonitor() {
  const monitor = usePerformanceMonitor()

  const measureApiCall = useCallback(async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    return monitor.measureAsync(`API_${endpoint}`, apiCall, { endpoint })
  }, [monitor])

  return {
    ...monitor,
    measureApiCall
  }
}
