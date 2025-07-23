'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import GmailIntegration from '@/components/GmailIntegration'

interface UserSettings {
  id: string
  user_id: string
  company_name: string
  sender_name: string
  sender_email: string
  signature: string
  auto_send_enabled: boolean
  daily_send_limit: number
  send_delay_minutes: number
  created_at: string
  updated_at: string
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { showNotification } = useNotification()
  const [_settings, _setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState({
    company_name: '',
    sender_name: '',
    sender_email: '',
    signature: '',
    auto_send_enabled: false,
    daily_send_limit: 50,
    send_delay_minutes: 5
  })

  // 获取用户设置
  const fetchSettings = useCallback(async () => {
    if (!user) return

    try {
      // 这里应该从数据库获取用户设置
      // 暂时使用默认值
      const defaultSettings = {
        company_name: '',
        sender_name: user.user_metadata?.full_name || '',
        sender_email: user.email || '',
        signature: '',
        auto_send_enabled: false,
        daily_send_limit: 50,
        send_delay_minutes: 5
      }

      setFormData(defaultSettings)
    } catch (error) {
      console.error('获取设置失败:', error)
      showNotification('error', '加载失败', '无法获取用户设置')
    } finally {
      setLoading(false)
    }
  }, [user, showNotification])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // 保存设置
  const saveSettings = async () => {
    if (!user) return

    setSaving(true)
    try {
      // 这里应该保存到数据库
      // 暂时只显示成功消息
      await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用

      showNotification('success', '保存成功', '设置已更新')
    } catch (error) {
      console.error('保存设置失败:', error)
      showNotification('error', '保存失败', '无法保存设置')
    } finally {
      setSaving(false)
    }
  }

  // 重置设置
  const resetSettings = () => {
    if (!confirm('确定要重置所有设置吗？此操作无法撤销。')) return

    setFormData({
      company_name: '',
      sender_name: user?.user_metadata?.full_name || '',
      sender_email: user?.email || '',
      signature: '',
      auto_send_enabled: false,
      daily_send_limit: 50,
      send_delay_minutes: 5
    })

    showNotification('info', '已重置', '设置已重置为默认值')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="mt-1 text-sm text-gray-600">
          配置您的邮件自动化系统参数和个人信息
        </p>
      </div>

      {/* 基本信息设置 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
                公司名称
              </label>
              <input
                type="text"
                id="company-name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="输入您的公司名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="sender-name" className="block text-sm font-medium text-gray-700 mb-2">
                发件人姓名
              </label>
              <input
                type="text"
                id="sender-name"
                value={formData.sender_name}
                onChange={(e) => setFormData(prev => ({ ...prev, sender_name: e.target.value }))}
                placeholder="输入发件人姓名"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="sender-email" className="block text-sm font-medium text-gray-700 mb-2">
                发件人邮箱
              </label>
              <input
                type="email"
                id="sender-email"
                value={formData.sender_email}
                onChange={(e) => setFormData(prev => ({ ...prev, sender_email: e.target.value }))}
                placeholder="输入发件人邮箱"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-2">
              邮件签名
            </label>
            <textarea
              id="signature"
              value={formData.signature}
              onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
              placeholder="输入您的邮件签名..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              邮件签名将自动添加到所有发送的邮件末尾
            </p>
          </div>
        </div>
      </div>

      {/* 自动化设置 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">自动化设置</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">启用自动发送</h3>
                <p className="text-sm text-gray-500">自动发送AI生成的邮件给客户线索</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_send_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, auto_send_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="daily-limit" className="block text-sm font-medium text-gray-700 mb-2">
                  每日发送限制
                </label>
                <input
                  type="number"
                  id="daily-limit"
                  value={formData.daily_send_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_send_limit: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  每天最多发送的邮件数量（建议不超过100）
                </p>
              </div>
              
              <div>
                <label htmlFor="send-delay" className="block text-sm font-medium text-gray-700 mb-2">
                  发送间隔（分钟）
                </label>
                <input
                  type="number"
                  id="send-delay"
                  value={formData.send_delay_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, send_delay_minutes: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  两封邮件之间的最小间隔时间
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gmail集成设置 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Gmail集成</h2>
          <GmailIntegration />
        </div>
      </div>

      {/* 账户管理 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">账户管理</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">账户信息</h3>
                <p className="text-sm text-gray-500">邮箱: {user?.email}</p>
                <p className="text-sm text-gray-500">
                  注册时间: {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '未知'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <h3 className="text-sm font-medium text-red-900">危险操作</h3>
                <p className="text-sm text-red-700">退出登录将清除本地数据</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('确定要退出登录吗？')) {
                    signOut()
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={resetSettings}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          重置设置
        </button>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
