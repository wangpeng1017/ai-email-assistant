'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import { supabase } from '@/lib/supabase'

interface ProductMaterial {
  id: string
  user_id: string
  created_at: string
  file_name: string
  storage_path: string
  file_type: string
  description?: string
  keywords?: string[]
  file_size?: number
}

export default function ProductMaterialsManager() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [materials, setMaterials] = useState<ProductMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // 获取产品资料列表
  const fetchMaterials = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('product_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('获取产品资料失败:', error)
      showNotification('error', '加载失败', '无法获取产品资料列表')
    } finally {
      setLoading(false)
    }
  }, [user, showNotification])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  // 文件上传处理
  const handleFileUpload = async (files: FileList) => {
    if (!user || !files.length) return

    setUploading(true)
    const uploadResults = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 检查文件大小 (限制10MB)
        if (file.size > 10 * 1024 * 1024) {
          showNotification('error', '文件过大', `${file.name} 超过10MB限制`)
          continue
        }

        // 生成唯一文件名
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${user.id}/materials/${fileName}`

        // 上传到Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('product-materials')
          .upload(filePath, file)

        if (uploadError) {
          console.error('文件上传失败:', uploadError)
          showNotification('error', '上传失败', `${file.name} 上传失败`)
          continue
        }

        // 保存文件信息到数据库
        const { data, error: dbError } = await supabase
          .from('product_materials')
          .insert({
            user_id: user.id,
            file_name: file.name,
            storage_path: filePath,
            file_type: file.type,
            file_size: file.size
          })
          .select()
          .single()

        if (dbError) {
          console.error('数据库保存失败:', dbError)
          // 删除已上传的文件
          await supabase.storage.from('product-materials').remove([filePath])
          showNotification('error', '保存失败', `${file.name} 信息保存失败`)
          continue
        }

        uploadResults.push(data)
      }

      if (uploadResults.length > 0) {
        showNotification('success', '上传成功', `成功上传 ${uploadResults.length} 个文件`)
        fetchMaterials() // 刷新列表
      }
    } catch (error) {
      console.error('上传过程出错:', error)
      showNotification('error', '上传失败', '文件上传过程中出现错误')
    } finally {
      setUploading(false)
      setSelectedFiles(null)
    }
  }

  // 删除文件
  const handleDelete = async (material: ProductMaterial) => {
    if (!confirm(`确定要删除 "${material.file_name}" 吗？`)) return

    try {
      // 从Storage删除文件
      const { error: storageError } = await supabase.storage
        .from('product-materials')
        .remove([material.storage_path])

      if (storageError) {
        console.error('Storage删除失败:', storageError)
      }

      // 从数据库删除记录
      const { error: dbError } = await supabase
        .from('product_materials')
        .delete()
        .eq('id', material.id)

      if (dbError) throw dbError

      showNotification('success', '删除成功', `已删除 ${material.file_name}`)
      fetchMaterials() // 刷新列表
    } catch (error) {
      console.error('删除失败:', error)
      showNotification('error', '删除失败', '无法删除文件')
    }
  }

  // 下载文件
  const handleDownload = async (material: ProductMaterial) => {
    try {
      const { data, error } = await supabase.storage
        .from('product-materials')
        .download(material.storage_path)

      if (error) throw error

      // 创建下载链接
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = material.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载失败:', error)
      showNotification('error', '下载失败', '无法下载文件')
    }
  }

  // 拖拽处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    } else if (fileType.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )
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
        <h1 className="text-2xl font-bold text-gray-900">产品资料管理</h1>
        <p className="mt-1 text-sm text-gray-600">
          上传和管理您的产品资料，AI将使用这些资料生成个性化邮件内容
        </p>
      </div>

      {/* 文件上传区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">上传产品资料</h2>
          
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${uploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className="mt-4">
              <p className="text-lg font-medium text-gray-900">
                {uploading ? '上传中...' : '拖拽文件到此处或点击选择'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支持 PDF、Word、图片等格式，单个文件最大10MB
              </p>
            </div>
            
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              disabled={uploading}
            />
            
            <label
              htmlFor="file-upload"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50"
            >
              {uploading ? '上传中...' : '选择文件'}
            </label>
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">已上传的资料</h2>
            <span className="text-sm text-gray-500">{materials.length} 个文件</span>
          </div>
          
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">还没有上传任何产品资料</p>
              <p className="text-xs text-gray-400 mt-1">上传产品资料后，AI将能够生成更精准的邮件内容</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(material.file_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={material.file_name}>
                        {material.file_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {material.file_size && formatFileSize(material.file_size)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(material.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleDownload(material)}
                      className="flex-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                    >
                      下载
                    </button>
                    <button
                      onClick={() => handleDelete(material)}
                      className="flex-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
