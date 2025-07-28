'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/components/Notification'
import { supabase } from '@/lib/supabase'

interface ScrapedLead {
  company_name: string
  website_url: string
  email?: string
  description?: string
}

interface WebScrapingFormProps {
  onClose?: () => void
  onSubmit: () => void
}

export default function WebScrapingForm({
  onSubmit
}: WebScrapingFormProps) {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [targetUrl, setTargetUrl] = useState('')
  const [crawlDepth, setCrawlDepth] = useState('1')
  const [maxResults, setMaxResults] = useState('50')
  const [isProcessing, setIsProcessing] = useState(false)
  const [scrapedLeads, setScrapedLeads] = useState<ScrapedLead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set())

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSaveSelectedLeads = async () => {
    if (!user || selectedLeads.size === 0) {
        showNotification('info', '未选择线索', '请至少选择一条线索进行保存');
        return;
    }

    const leadsToSave = scrapedLeads.filter((_, index) => selectedLeads.has(index));

    try {
      const leadsData = leadsToSave.map(lead => ({
        user_id: user.id,
        customer_name: lead.company_name,
        company_name: lead.company_name,
        email: lead.email || null,
        website: lead.website_url,
        source: 'scraped',
        status: 'new',
        notes: lead.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('customer_leads')
        .insert(leadsData);

      if (error) {
        if (error.message.includes('relation "public.customer_leads" does not exist')) {
            console.log('customer_leads表不存在，回退到leads表');
            const fallbackLeads = leadsData.map(l => ({ ...l, customer_email: l.email, customer_website: l.website, status: 'pending' }));
            const { error: fallbackError } = await supabase.from('leads').insert(fallbackLeads);
            if (fallbackError) throw fallbackError;
        } else {
            throw error;
        }
      }

      showNotification('success', '保存成功', `成功保存 ${leadsToSave.length} 条线索`);
      setScrapedLeads([]);
      setSelectedLeads(new Set());
      onSubmit(); // Refresh the main leads list
    } catch (error) {
      console.error('保存线索失败:', error);
      showNotification('error', '保存失败', '保存线索时出错');
    }
  };

  const handleStartScraping = async () => {
    if (!targetUrl.trim() || !isValidUrl(targetUrl)) {
      showNotification('error', '输入无效', '请输入有效的网站URL')
      return
    }
    if (!user) {
      showNotification('error', '需要登录', '请先登录后再执行操作')
      return
    }

    setIsProcessing(true)
    setScrapedLeads([])
    setSelectedLeads(new Set())

    try {
      const response = await fetch('/api/scraping/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          crawlDepth: parseInt(crawlDepth),
          maxResults: parseInt(maxResults),
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '爬取请求失败')
      }

      if (data.leads && data.leads.length > 0) {
        setScrapedLeads(data.leads)
        setSelectedLeads(new Set(data.leads.map((_: ScrapedLead, index: number) => index)))
        showNotification('success', '爬取成功', `成功爬取到 ${data.leads.length} 条潜在客户线索，请选择后保存。`)
      } else {
        showNotification('warning', '未找到线索', '未找到有效的客户线索，请尝试其他网站或调整参数。')
      }
    } catch (error) {
      console.error('爬取操作失败:', error)
      showNotification('error', '爬取失败', error instanceof Error ? error.message : '网页爬取过程中出现未知错误')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleLeadSelection = (index: number) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(index)) {
        newSelection.delete(index);
    } else {
        newSelection.add(index);
    }
    setSelectedLeads(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === scrapedLeads.length) {
        setSelectedLeads(new Set());
    } else {
        setSelectedLeads(new Set(scrapedLeads.map((_, i) => i)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">智能网页爬取</h3>
            <p className="text-sm text-gray-600">自动从目标网站爬取客户联系信息，快速建立客户线索库。</p>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="target-url" className="block text-sm font-medium text-gray-700 mb-2">目标网站URL</label>
            <input type="url" id="target-url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://example.com/companies" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={isProcessing} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="crawl-depth" className="block text-sm font-medium text-gray-700 mb-2">爬取深度</label>
              <select id="crawl-depth" value={crawlDepth} onChange={(e) => setCrawlDepth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={isProcessing}>
                <option value="1">1层（仅首页）</option>
                <option value="2">2层（首页+子页面）</option>
                <option value="3">3层（深度爬取）</option>
              </select>
            </div>
            <div>
              <label htmlFor="max-results" className="block text-sm font-medium text-gray-700 mb-2">最大结果数</label>
              <select id="max-results" value={maxResults} onChange={(e) => setMaxResults(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={isProcessing}>
                <option value="10">10条</option>
                <option value="25">25条</option>
                <option value="50">50条</option>
                <option value="100">100条</option>
              </select>
            </div>
          </div>
          <button onClick={handleStartScraping} disabled={isProcessing || !targetUrl.trim()} className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
            {isProcessing ? '爬取中...' : '开始爬取'}
          </button>
        </div>
      </div>

      {scrapedLeads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">爬取结果 ({selectedLeads.size}/{scrapedLeads.length} 已选)</h3>
                <button onClick={handleSaveSelectedLeads} disabled={selectedLeads.size === 0} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
                    保存所选线索
                </button>
            </div>
            <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-2 flex items-center border-b">
                    <input type="checkbox" checked={selectedLeads.size === scrapedLeads.length} onChange={toggleSelectAll} className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                    <label className="ml-3 text-sm font-medium text-gray-700">全选</label>
                </div>
                <ul className="divide-y divide-gray-200 h-64 overflow-y-auto">
                    {scrapedLeads.map((lead, index) => (
                        <li key={index} className="p-3 flex items-center cursor-pointer hover:bg-gray-50" onClick={() => toggleLeadSelection(index)}>
                            <input type="checkbox" checked={selectedLeads.has(index)} onChange={() => {}} className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{lead.company_name}</p>
                                <p className="text-sm text-gray-500">{lead.website_url}</p>
                                {lead.email && <p className="text-sm text-blue-500">{lead.email}</p>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      )}
    </div>
  )
}