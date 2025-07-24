'use client'

import React from 'react'
import { useAppStore } from '@/stores/appStore'
import { DocumentIcon, CloudIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline'

const MaterialsStats: React.FC = () => {
  const materials = useAppStore((state) => state.materials)

  // 计算材料统计信息
  const stats = React.useMemo(() => {
    const total = materials.length
    const totalSize = materials.reduce((sum, material) => sum + (material.file_size || 0), 0)
    const fileTypes = new Set(materials.map(material => material.file_type)).size
    const recentUploads = materials.filter(material => {
      const uploadDate = new Date(material.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return uploadDate > weekAgo
    }).length

    return { total, totalSize, fileTypes, recentUploads }
  }, [materials])

  const statCards = [
    {
      title: '总文件数',
      value: stats.total,
      icon: DocumentIcon,
      color: 'blue',
      description: '已上传的文件总数'
    },
    {
      title: '存储空间',
      value: `${(stats.totalSize / 1024 / 1024).toFixed(1)}MB`,
      icon: CloudIcon,
      color: 'green',
      description: '已使用的存储空间'
    },
    {
      title: '文件类型',
      value: stats.fileTypes,
      icon: ChartBarIcon,
      color: 'purple',
      description: '支持的文件类型数'
    },
    {
      title: '最近上传',
      value: stats.recentUploads,
      icon: ClockIcon,
      color: 'orange',
      description: '本周新增文件数'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg bg-${card.color}-100`}>
                <Icon className={`w-6 h-6 text-${card.color}-600`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">{card.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default React.memo(MaterialsStats)
