'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface GmailAuthStatus {
  hasAuth: boolean
  isExpired: boolean
  expiresAt: string | null
}

interface GmailIntegrationProps {
  onAuthComplete?: (tokens: { accessToken: string; refreshToken?: string }) => void
  className?: string
}

export default function GmailIntegration({ onAuthComplete, className = '' }: GmailIntegrationProps) {
  const { user, session } = useAuth()
  const [authStatus, setAuthStatus] = useState<GmailAuthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 检查Gmail认证状态
  const checkAuthStatus = async () => {
    if (!user || !session) return

    try {
      const response = await fetch('/api/gmail/auth-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAuthStatus(data)
      }
    } catch (error) {
      console.error('Error checking Gmail auth status:', error)
    }
  }

  // 启动Gmail OAuth流程
  const startGmailAuth = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // 获取授权URL
      const response = await fetch(`/api/gmail/auth?userId=${user.id}`)
      const data = await response.json()

      if (response.ok && data.authUrl) {
        // 在新窗口中打开授权页面
        const authWindow = window.open(
          data.authUrl,
          'gmail-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        // 监听授权完成
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed)
            setLoading(false)
            // 重新检查认证状态
            checkAuthStatus()
          }
        }, 1000)

        // 监听来自授权窗口的消息
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
            clearInterval(checkClosed)
            authWindow?.close()
            setLoading(false)
            
            // 调用回调函数
            if (onAuthComplete) {
              onAuthComplete({
                accessToken: event.data.accessToken,
                refreshToken: event.data.refreshToken
              })
            }
            
            // 更新认证状态
            checkAuthStatus()
          } else if (event.data.type === 'GMAIL_AUTH_ERROR') {
            clearInterval(checkClosed)
            authWindow?.close()
            setLoading(false)
            setError(event.data.error || 'Gmail authorization failed')
          }
        }

        window.addEventListener('message', handleMessage)

        // 清理事件监听器
        setTimeout(() => {
          window.removeEventListener('message', handleMessage)
          clearInterval(checkClosed)
          if (!authWindow?.closed) {
            authWindow?.close()
            setLoading(false)
          }
        }, 300000) // 5分钟超时

      } else {
        throw new Error(data.error || 'Failed to get authorization URL')
      }
    } catch (error) {
      setLoading(false)
      setError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // 撤销Gmail授权
  const revokeGmailAuth = async () => {
    if (!user || !session) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/gmail/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setAuthStatus({ hasAuth: false, isExpired: true, expiresAt: null })
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke authorization')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [user])

  const getStatusIcon = () => {
    if (!authStatus) return '⏳'
    if (authStatus.hasAuth && !authStatus.isExpired) return '✅'
    if (authStatus.hasAuth && authStatus.isExpired) return '⚠️'
    return '❌'
  }

  const getStatusText = () => {
    if (!authStatus) return '检查中...'
    if (authStatus.hasAuth && !authStatus.isExpired) return 'Gmail已连接'
    if (authStatus.hasAuth && authStatus.isExpired) return 'Gmail授权已过期'
    return 'Gmail未连接'
  }

  const getStatusColor = () => {
    if (!authStatus) return 'text-gray-500'
    if (authStatus.hasAuth && !authStatus.isExpired) return 'text-green-600'
    if (authStatus.hasAuth && authStatus.isExpired) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819v.273L12 8.91l6.545-4.816v-.273h3.819c.904 0 1.636.732 1.636 1.636z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gmail集成</h3>
            <p className="text-sm text-gray-500">连接Gmail以创建和发送邮件草稿</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {authStatus?.expiresAt && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-600">
            授权过期时间: {new Date(authStatus.expiresAt).toLocaleString()}
          </p>
        </div>
      )}

      <div className="flex space-x-3">
        {!authStatus?.hasAuth || authStatus?.isExpired ? (
          <button
            onClick={startGmailAuth}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? '授权中...' : '连接Gmail'}
          </button>
        ) : (
          <button
            onClick={revokeGmailAuth}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? '处理中...' : '断开连接'}
          </button>
        )}
        
        <button
          onClick={checkAuthStatus}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          刷新状态
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>• Gmail集成允许直接在Gmail中创建邮件草稿</p>
        <p>• 您可以在Gmail中编辑和发送生成的邮件</p>
        <p>• 授权信息安全存储，可随时撤销</p>
      </div>
    </div>
  )
}
