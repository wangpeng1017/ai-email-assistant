'use client'

import { useEffect, useRef } from 'react'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'

interface PagePerformanceMonitorProps {
  pageName: string
  children: React.ReactNode
  enableDetailedLogging?: boolean
}

export default function PagePerformanceMonitor({ 
  pageName, 
  children, 
  enableDetailedLogging = false 
}: PagePerformanceMonitorProps) {
  const monitor = usePerformanceMonitor()
  const hasLoggedInitialLoad = useRef(false)

  useEffect(() => {
    if (!hasLoggedInitialLoad.current) {
      // 延迟测量，确保页面完全加载
      const timer = setTimeout(() => {
        const metrics = monitor.measurePageLoad(pageName)
        
        if (enableDetailedLogging && metrics) {
          // 发送性能数据到控制台（生产环境可以发送到监控服务）
          console.group(`🚀 Page Performance Report: ${pageName}`)
          console.log('📊 Core Web Vitals:')
          console.log(`  • Time to Interactive: ${metrics.timeToInteractive.toFixed(2)}ms`)
          console.log(`  • DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`)
          console.log(`  • Load Complete: ${metrics.loadComplete.toFixed(2)}ms`)
          
          if (metrics.firstContentfulPaint > 0) {
            console.log(`  • First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`)
          }

          // 性能评级
          const rating = getPerformanceRating(metrics.timeToInteractive)
          console.log(`📈 Performance Rating: ${rating.emoji} ${rating.label}`)
          
          if (rating.suggestions.length > 0) {
            console.log('💡 Optimization Suggestions:')
            rating.suggestions.forEach(suggestion => {
              console.log(`  • ${suggestion}`)
            })
          }
          
          console.groupEnd()
        }
        
        hasLoggedInitialLoad.current = true
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [pageName, monitor, enableDetailedLogging])

  // 监控页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(`👁️ Page ${pageName} became visible`)
      } else {
        console.log(`🙈 Page ${pageName} became hidden`)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pageName])

  return <>{children}</>
}

// 性能评级函数
function getPerformanceRating(timeToInteractive: number) {
  if (timeToInteractive < 1000) {
    return {
      emoji: '🚀',
      label: 'Excellent (< 1s)',
      suggestions: []
    }
  } else if (timeToInteractive < 2000) {
    return {
      emoji: '✅',
      label: 'Good (1-2s)',
      suggestions: ['Consider optimizing images', 'Enable compression']
    }
  } else if (timeToInteractive < 4000) {
    return {
      emoji: '⚠️',
      label: 'Needs Improvement (2-4s)',
      suggestions: [
        'Optimize JavaScript bundles',
        'Implement code splitting',
        'Add caching strategies',
        'Optimize database queries'
      ]
    }
  } else {
    return {
      emoji: '🐌',
      label: 'Poor (> 4s)',
      suggestions: [
        'Critical: Implement lazy loading',
        'Critical: Add data caching',
        'Critical: Optimize API calls',
        'Critical: Review database performance',
        'Consider using a CDN'
      ]
    }
  }
}

// 专用的页面性能包装器
export function withPagePerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  pageName: string,
  enableDetailedLogging = false
) {
  return function WrappedComponent(props: P) {
    return (
      <PagePerformanceMonitor 
        pageName={pageName} 
        enableDetailedLogging={enableDetailedLogging}
      >
        <Component {...props} />
      </PagePerformanceMonitor>
    )
  }
}

// 性能监控Hook，用于组件内部
export function usePagePerformance(pageName: string) {
  const monitor = usePerformanceMonitor()

  const trackUserAction = (actionName: string, metadata?: Record<string, unknown>) => {
    return monitor.measureAsync(`${pageName}_${actionName}`, async () => {
      // 这里可以添加用户行为追踪逻辑
      console.log(`👆 User action: ${actionName} on ${pageName}`, metadata)
    }, metadata)
  }

  const trackApiCall = async <T,>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    return monitor.measureAsync(`${pageName}_API_${apiName}`, apiCall, { page: pageName })
  }

  const getPageStats = () => {
    const stats = monitor.getStats()
    return {
      ...stats,
      pageSpecificMetrics: stats.recentMetrics.filter(metric => 
        metric.name.startsWith(pageName)
      )
    }
  }

  return {
    trackUserAction,
    trackApiCall,
    getPageStats,
    logStats: monitor.logStats
  }
}
