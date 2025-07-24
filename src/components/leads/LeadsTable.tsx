'use client'

import React from 'react'
import { Lead } from '@/stores/appStore'

interface LeadsTableProps {
  leads: Lead[]
  onUpdateLead: (data: { id: string; updates: Record<string, unknown> }) => void
  onDeleteLead: (id: string) => void
  isUpdating: boolean
  isDeleting: boolean
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onUpdateLead,
  onDeleteLead,
  isUpdating,
  isDeleting
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              客户信息
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              来源
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              创建时间
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {lead.customer_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {lead.customer_email}
                  </div>
                  {lead.customer_website && (
                    <div className="text-sm text-blue-600">
                      {lead.customer_website}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {lead.source}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  lead.status === 'completed' ? 'bg-green-100 text-green-800' :
                  lead.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  lead.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {lead.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(lead.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onUpdateLead({ id: lead.id, updates: { status: 'processing' } })}
                    disabled={isUpdating}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => onDeleteLead(lead.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {leads.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-medium">暂无客户线索</p>
            <p className="text-sm">开始添加您的第一个客户线索</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(LeadsTable)
