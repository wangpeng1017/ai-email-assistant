'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ProgressStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message?: string
  startTime?: number
  endTime?: number
  progress?: number
}

interface BatchProgress {
  totalItems: number
  completedItems: number
  failedItems: number
  currentItem?: string
  steps: ProgressStep[]
  startTime: number
  estimatedEndTime?: number
}

interface RealTimeProgressProps {
  batchId?: string
  onComplete?: (results: any) => void
  onError?: (error: string) => void
  className?: string
}

export default function RealTimeProgress({
  batchId,
  onComplete,
  onError,
  className = ''
}: RealTimeProgressProps) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // 初始化进度步骤
  const initializeSteps = (): ProgressStep[] => [
    { id: 'init', name: '初始化处理', status: 'pending' },
    { id: 'fetch', name: '获取客户线索', status: 'pending' },
    { id: 'analyze', name: '分析客户网站', status: 'pending' },
    { id: 'generate', name: '生成邮件内容', status: 'pending' },
    { id: 'attachments', name: '匹配智能附件', status: 'pending' },
    { id: 'create_draft', name: '创建Gmail草稿', status: 'pending' },
    { id: 'complete', name: '完成处理', status: 'pending' }
  ]

  // 启动进度监控
  const startProgressMonitoring = (totalItems: number = 1) => {
    const now = Date.now()
    setProgress({
      totalItems,
      completedItems: 0,
      failedItems: 0,
      steps: initializeSteps(),
      startTime: now
    })
    setIsVisible(true)
    setLogs([`${new Date().toLocaleTimeString()} - 开始处理 ${totalItems} 个客户线索`])

    // 启动轮询
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      fetchProgress()
    }, 1000)
  }

  // 获取进度信息
  const fetchProgress = async () => {
    if (!user || !batchId) return

    try {
      const response = await fetch(`/api/automation/progress?batchId=${batchId}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        updateProgress(data)
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  }

  // 更新进度信息
  const updateProgress = (data: any) => {
    setProgress(prev => {
      if (!prev) return null

      const updatedSteps = prev.steps.map(step => {
        if (data.currentStep === step.id) {
          return {
            ...step,
            status: 'running' as const,
            message: data.message,
            progress: data.stepProgress
          }
        } else if (data.completedSteps?.includes(step.id)) {
          return {
            ...step,
            status: 'completed' as const,
            endTime: Date.now()
          }
        } else if (data.failedSteps?.includes(step.id)) {
          return {
            ...step,
            status: 'failed' as const,
            message: data.error,
            endTime: Date.now()
          }
        }
        return step
      })

      const newProgress = {
        ...prev,
        completedItems: data.completedItems || prev.completedItems,
        failedItems: data.failedItems || prev.failedItems,
        currentItem: data.currentItem,
        steps: updatedSteps,
        estimatedEndTime: data.estimatedEndTime
      }

      // 添加日志
      if (data.message) {
        setLogs(prevLogs => [
          ...prevLogs,
          `${new Date().toLocaleTimeString()} - ${data.message}`
        ].slice(-50)) // 保留最近50条日志
      }

      // 检查是否完成
      if (data.status === 'completed') {
        handleComplete(data.results)
      } else if (data.status === 'failed') {
        handleError(data.error)
      }

      return newProgress
    })
  }

  // 处理完成
  const handleComplete = (results: any) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()} - 处理完成！`
    ])

    if (onComplete) {
      onComplete(results)
    }

    // 3秒后自动隐藏
    setTimeout(() => {
      setIsVisible(false)
    }, 3000)
  }

  // 处理错误
  const handleError = (error: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setLogs(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()} - 错误: ${error}`
    ])

    if (onError) {
      onError(error)
    }
  }

  // 关闭进度显示
  const closeProgress = () => {
    setIsVisible(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // 获取步骤状态图标
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500">✅</span>
      case 'running':
        return <span className="text-blue-500 animate-spin">⏳</span>
      case 'failed':
        return <span className="text-red-500">❌</span>
      default:
        return <span className="text-gray-400">⏸️</span>
    }
  }

  // 计算总体进度百分比
  const calculateOverallProgress = () => {
    if (!progress) return 0
    
    const completedSteps = progress.steps.filter(s => s.status === 'completed').length
    const totalSteps = progress.steps.length
    const itemProgress = progress.totalItems > 0 ? (progress.completedItems / progress.totalItems) * 100 : 0
    const stepProgress = (completedSteps / totalSteps) * 100
    
    return Math.round((itemProgress + stepProgress) / 2)
  }

  // 格式化时间
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // 暴露启动方法给父组件
  useEffect(() => {
    if (batchId) {
      startProgressMonitoring()
    }
  }, [batchId])

  if (!isVisible || !progress) {
    return null
  }

  const overallProgress = calculateOverallProgress()
  const elapsedTime = Date.now() - progress.startTime

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">处理进度</h3>
              <p className="text-sm text-gray-500">
                {progress.completedItems}/{progress.totalItems} 已完成 • 
                已用时 {formatDuration(elapsedTime)}
              </p>
            </div>
          </div>
          
          <button
            onClick={closeProgress}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* 总体进度条 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">总体进度</span>
            <span className="text-sm text-gray-500">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* 步骤列表 */}
        <div className="p-6 max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-4">处理步骤</h4>
          <div className="space-y-3">
            {progress.steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'running' ? 'text-blue-700' :
                    step.status === 'failed' ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  {step.message && (
                    <p className="text-xs text-gray-500 mt-1">{step.message}</p>
                  )}
                  {step.status === 'running' && step.progress && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${step.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 日志 */}
        <div className="border-t border-gray-200">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">处理日志</h4>
            <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {logs.slice(-10).map((log, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
