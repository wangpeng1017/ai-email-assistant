'use client'

import React from 'react'
import { 
  UsersIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'
import { StatsState } from '@/stores/appStore'
import { LeadsStatsSkeleton } from '@/components/skeletons/LeadsSkeleton'

interface LeadsStatsProps {
  stats: StatsState | null
  isLoading?: boolean
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'yellow' | 'green' | 'red' | 'purple'
  trend?: {
    value: number
    isPositive: boolean
  }
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      text: 'text-yellow-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-600'
    }
  }

  const classes = colorClasses[color]

  // 安全地处理value，确保它是一个有效的数字
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0

  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{safeValue.toLocaleString()}</p>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs 上月</span>
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 ${classes.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${classes.icon}`} />
        </div>
      </div>
    </div>
  )
}

const LeadsStats: React.FC<LeadsStatsProps> = ({ stats, isLoading = false }) => {
  // 如果正在加载，显示骨架屏
  if (isLoading || !stats) {
    return <LeadsStatsSkeleton />
  }

  // 计算转化率
  const conversionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0'
  
  // 计算处理中的比例
  const processingRate = stats.total > 0 ? ((stats.processing / stats.total) * 100).toFixed(1) : '0'

  const statsData = [
    {
      title: '总线索数',
      value: stats.total,
      icon: UsersIcon,
      color: 'blue' as const,
      trend: {
        value: 12.5,
        isPositive: true
      }
    },
    {
      title: '待处理',
      value: stats.pending,
      icon: ClockIcon,
      color: 'yellow' as const,
      trend: {
        value: 8.2,
        isPositive: false
      }
    },
    {
      title: '处理中',
      value: stats.processing,
      icon: ChartBarIcon,
      color: 'purple' as const,
      trend: {
        value: 15.3,
        isPositive: true
      }
    },
    {
      title: '已完成',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'green' as const,
      trend: {
        value: 23.1,
        isPositive: true
      }
    },
    {
      title: '失败/取消',
      value: stats.failed,
      icon: ExclamationTriangleIcon,
      color: 'red' as const,
      trend: {
        value: 5.7,
        isPositive: false
      }
    }
  ]

  return (
    <div className="space-y-4">
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* 额外的洞察信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">转化率</p>
              <p className="text-xl font-bold text-gray-900">{conversionRate}%</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">处理率</p>
              <p className="text-xl font-bold text-gray-900">{processingRate}%</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">平均处理时间</p>
              <p className="text-xl font-bold text-gray-900">2.3天</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(LeadsStats)
