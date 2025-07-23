'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import { supabase } from '@/lib/supabase'

interface EmailTemplate {
  id: string
  user_id: string
  name: string
  subject: string
  content: string
  category: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export default function EmailTemplates() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'general'
  })

  // 获取模板列表
  const fetchTemplates = useCallback(async () => {
    if (!user) return

    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('获取模板失败:', error)
      showNotification('error', '加载失败', '无法获取邮件模板列表')
    } finally {
      setLoading(false)
    }
  }, [user, categoryFilter, showNotification])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      template.name.toLowerCase().includes(term) ||
      template.subject.toLowerCase().includes(term) ||
      template.content.toLowerCase().includes(term)
    )
  })

  // 保存模板
  const saveTemplate = async () => {
    if (!user) return

    if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      showNotification('error', '输入错误', '请填写所有必需字段')
      return
    }

    try {
      if (editingTemplate) {
        // 更新现有模板
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: formData.name.trim(),
            subject: formData.subject.trim(),
            content: formData.content.trim(),
            category: formData.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id)
          .eq('user_id', user.id)

        if (error) throw error
        showNotification('success', '更新成功', '邮件模板已更新')
      } else {
        // 创建新模板
        const { error } = await supabase
          .from('email_templates')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            subject: formData.subject.trim(),
            content: formData.content.trim(),
            category: formData.category,
            is_default: false
          })

        if (error) throw error
        showNotification('success', '创建成功', '邮件模板已创建')
      }

      // 重置表单并关闭模态框
      setFormData({ name: '', subject: '', content: '', category: 'general' })
      setIsCreateModalOpen(false)
      setEditingTemplate(null)
      fetchTemplates()
    } catch (error) {
      console.error('保存模板失败:', error)
      showNotification('error', '保存失败', '无法保存邮件模板')
    }
  }

  // 删除模板
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('确定要删除这个模板吗？此操作无法撤销。')) return

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id)

      if (error) throw error

      setTemplates(prev => prev.filter(template => template.id !== templateId))
      showNotification('success', '删除成功', '邮件模板已删除')
    } catch (error) {
      console.error('删除失败:', error)
      showNotification('error', '删除失败', '无法删除邮件模板')
    }
  }

  // 设置默认模板
  const setDefaultTemplate = async (templateId: string) => {
    try {
      // 先取消所有默认模板
      await supabase
        .from('email_templates')
        .update({ is_default: false })
        .eq('user_id', user?.id)

      // 设置新的默认模板
      const { error } = await supabase
        .from('email_templates')
        .update({ is_default: true })
        .eq('id', templateId)
        .eq('user_id', user?.id)

      if (error) throw error

      setTemplates(prev => prev.map(template => ({
        ...template,
        is_default: template.id === templateId
      })))

      showNotification('success', '设置成功', '默认模板已更新')
    } catch (error) {
      console.error('设置默认模板失败:', error)
      showNotification('error', '设置失败', '无法设置默认模板')
    }
  }

  // 编辑模板
  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category
    })
    setIsCreateModalOpen(true)
  }

  // 获取分类标签
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return '通用'
      case 'introduction': return '介绍'
      case 'follow_up': return '跟进'
      case 'proposal': return '提案'
      case 'thank_you': return '感谢'
      default: return category
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">邮件模板</h1>
            <p className="mt-1 text-sm text-gray-600">
              创建和管理邮件模板，提高邮件发送效率
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null)
              setFormData({ name: '', subject: '', content: '', category: 'general' })
              setIsCreateModalOpen(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            创建模板
          </button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              搜索模板
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索模板名称、主题或内容..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
              分类筛选
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部分类</option>
              <option value="general">通用</option>
              <option value="introduction">介绍</option>
              <option value="follow_up">跟进</option>
              <option value="proposal">提案</option>
              <option value="thank_you">感谢</option>
            </select>
          </div>
        </div>
      </div>

      {/* 模板列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              模板列表 ({filteredTemplates.length} 个)
            </h2>
          </div>
          
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm || categoryFilter !== 'all' 
                  ? '没有找到匹配的模板' 
                  : '还没有创建任何邮件模板'
                }
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <button
                  onClick={() => {
                    setEditingTemplate(null)
                    setFormData({ name: '', subject: '', content: '', category: 'general' })
                    setIsCreateModalOpen(true)
                  }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  创建第一个模板
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {template.name}
                        {template.is_default && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            默认
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {getCategoryLabel(template.category)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">主题:</p>
                    <p className="text-sm text-gray-600 truncate">{template.subject}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">内容预览:</p>
                    <p className="text-xs text-gray-500 line-clamp-3">
                      {template.content.substring(0, 100)}...
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editTemplate(template)}
                      className="flex-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                    >
                      编辑
                    </button>
                    {!template.is_default && (
                      <button
                        onClick={() => setDefaultTemplate(template.id)}
                        className="flex-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                      >
                        设为默认
                      </button>
                    )}
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="flex-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400">
                    创建于 {new Date(template.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 创建/编辑模板模态框 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTemplate ? '编辑模板' : '创建模板'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingTemplate(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-2">
                    模板名称 *
                  </label>
                  <input
                    type="text"
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入模板名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="template-category" className="block text-sm font-medium text-gray-700 mb-2">
                    分类
                  </label>
                  <select
                    id="template-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">通用</option>
                    <option value="introduction">介绍</option>
                    <option value="follow_up">跟进</option>
                    <option value="proposal">提案</option>
                    <option value="thank_you">感谢</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="template-subject" className="block text-sm font-medium text-gray-700 mb-2">
                  邮件主题 *
                </label>
                <input
                  type="text"
                  id="template-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="输入邮件主题"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="template-content" className="block text-sm font-medium text-gray-700 mb-2">
                  邮件内容 *
                </label>
                <textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="输入邮件内容..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  支持变量: {'{customer_name}'}, {'{customer_website}'}, {'{company_name}'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingTemplate(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingTemplate ? '更新模板' : '创建模板'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
