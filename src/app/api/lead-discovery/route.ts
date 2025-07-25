import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getErrorMessage, logError } from '@/lib/errorHandler'
import {
  LeadDiscoveryRequest,
  LeadDiscoveryResponse,
  DiscoveredLead,
  AIAnalysisResult,
  LeadRecord
} from '@/types'

// Gemini AI分析配置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

// 主要的线索发现处理
export async function POST(request: NextRequest) {
  try {
    const body: LeadDiscoveryRequest = await request.json()
    
    // 验证必需字段
    if (!body.userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    if (!body.industry && !body.keywords) {
      return NextResponse.json(
        { error: 'At least industry or keywords must be provided' },
        { status: 400 }
      )
    }

    // 创建发现任务记录
    const { data: job, error: jobError } = await supabase
      .from('lead_discovery_jobs')
      .insert({
        user_id: body.userId,
        job_name: `AI线索发现 - ${new Date().toLocaleString('zh-CN')}`,
        target_industry: body.industry,
        target_location: body.location,
        company_size: body.companySize,
        keywords: body.keywords,
        status: 'running',
        progress: 0,
        total_found: 0
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    try {
      // 执行线索发现
      const discoveryResult = await performLeadDiscovery(body)
      
      // 如果需要AI分析
      let aiAnalysis = null
      if (body.includeAnalysis !== false && discoveryResult.success) {
        aiAnalysis = await performAIAnalysis(body, discoveryResult.discoveredLeads || [])
      }

      // 保存发现的线索
      if (discoveryResult.success && discoveryResult.discoveredLeads) {
        await saveDiscoveredLeads(body.userId, discoveryResult.discoveredLeads, job.id)
      }

      // 更新任务状态
      await supabase
        .from('lead_discovery_jobs')
        .update({
          total_found: discoveryResult.totalDiscovered || 0,
          progress: 100,
          status: discoveryResult.success ? 'completed' : 'failed',
          error_message: discoveryResult.errors?.[0],
          results: {
            discoveredLeads: discoveryResult.discoveredLeads || [],
            aiAnalysis: aiAnalysis,
            totalDiscovered: discoveryResult.totalDiscovered || 0,
            processedLeads: discoveryResult.processedLeads || 0
          },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)

      const response: LeadDiscoveryResponse = {
        ...discoveryResult,
        jobId: job.id,
        aiAnalysis: aiAnalysis || undefined
      }

      return NextResponse.json(response)

    } catch (error) {
      // 更新任务状态为失败
      await supabase
        .from('lead_discovery_jobs')
        .update({
          status: 'failed',
          error_message: getErrorMessage(error),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)

      throw error
    }

  } catch (error) {
    logError('线索发现API错误', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// 执行线索发现
async function performLeadDiscovery(criteria: LeadDiscoveryRequest): Promise<LeadDiscoveryResponse> {
  try {
    // 这里实现实际的线索发现逻辑
    // 目前使用模拟数据和AI分析
    
    const discoveredLeads = await generateDiscoveredLeads(criteria)
    
    // 对发现的线索进行评分
    const scoredLeads = await scoreLeads(discoveredLeads, criteria)
    
    return {
      success: true,
      discoveredLeads: scoredLeads,
      totalDiscovered: scoredLeads.length,
      processedLeads: scoredLeads.length
    }

  } catch (error) {
    return {
      success: false,
      errors: [getErrorMessage(error)]
    }
  }
}

// 生成发现的线索（模拟数据）
async function generateDiscoveredLeads(criteria: LeadDiscoveryRequest): Promise<DiscoveredLead[]> {
  const { industry, location, companySize, maxResults = 50 } = criteria
  
  const leads: DiscoveredLead[] = []
  const industries = industry ? [industry] : ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing']
  const locations = location ? [location] : ['New York', 'San Francisco', 'London', 'Tokyo', 'Berlin']
  const sizes = companySize ? [companySize] : ['1-10人', '11-50人', '51-200人', '201-500人', '500+人']
  
  for (let i = 1; i <= Math.min(maxResults, 50); i++) {
    const selectedIndustry = industries[Math.floor(Math.random() * industries.length)]
    const selectedLocation = locations[Math.floor(Math.random() * locations.length)]
    const selectedSize = sizes[Math.floor(Math.random() * sizes.length)]
    
    leads.push({
      company_name: `${selectedIndustry} Company ${i}`,
      customer_email: `contact${i}@${selectedIndustry.toLowerCase()}company${i}.com`,
      customer_website: `https://${selectedIndustry.toLowerCase()}company${i}.com`,
      contact_person: `Contact Person ${i}`,
      phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      description: `A ${selectedIndustry.toLowerCase()} company based in ${selectedLocation} with ${selectedSize} employees.`,
      industry: selectedIndustry,
      location: selectedLocation,
      company_size: selectedSize,
      source: 'ai_discovery',
      discovery_confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
      match_reasons: generateMatchReasons(criteria, selectedIndustry, selectedLocation)
    })
  }
  
  return leads
}

// 生成匹配原因
function generateMatchReasons(criteria: LeadDiscoveryRequest, industry: string, location: string): string[] {
  const reasons = []
  
  if (criteria.industry && industry.toLowerCase().includes(criteria.industry.toLowerCase())) {
    reasons.push(`行业匹配: ${industry}`)
  }
  
  if (criteria.location && location.toLowerCase().includes(criteria.location.toLowerCase())) {
    reasons.push(`地区匹配: ${location}`)
  }
  
  if (criteria.keywords) {
    const keywords = criteria.keywords.split(',').map(k => k.trim())
    const matchedKeywords = keywords.filter(keyword => 
      Math.random() > 0.5 // 模拟关键词匹配
    )
    if (matchedKeywords.length > 0) {
      reasons.push(`关键词匹配: ${matchedKeywords.join(', ')}`)
    }
  }
  
  return reasons
}

// 对线索进行评分
async function scoreLeads(leads: DiscoveredLead[], criteria: LeadDiscoveryRequest): Promise<DiscoveredLead[]> {
  return leads.map(lead => {
    // 计算各维度评分
    const industryScore = calculateIndustryScore(lead, criteria)
    const locationScore = calculateLocationScore(lead, criteria)
    const companySizeScore = calculateCompanySizeScore(lead, criteria)
    const keywordScore = calculateKeywordScore(lead, criteria)
    
    // 计算总分
    const overallScore = (industryScore + locationScore + companySizeScore + keywordScore) / 4
    
    return {
      ...lead,
      scores: {
        overall: Math.round(overallScore * 100) / 100,
        industry: Math.round(industryScore * 100) / 100,
        location: Math.round(locationScore * 100) / 100,
        companySize: Math.round(companySizeScore * 100) / 100,
        keyword: Math.round(keywordScore * 100) / 100
      }
    }
  }).sort((a, b) => b.scores.overall - a.scores.overall) // 按总分排序
}

// 计算行业匹配分数
function calculateIndustryScore(lead: DiscoveredLead, criteria: LeadDiscoveryRequest): number {
  if (!criteria.industry) return 0.8 // 默认分数
  
  const leadIndustry = lead.industry?.toLowerCase() || ''
  const targetIndustry = criteria.industry.toLowerCase()
  
  if (leadIndustry.includes(targetIndustry) || targetIndustry.includes(leadIndustry)) {
    return 1.0
  }
  
  // 可以添加更复杂的行业相似度计算
  return 0.3
}

// 计算地区匹配分数
function calculateLocationScore(lead: DiscoveredLead, criteria: LeadDiscoveryRequest): number {
  if (!criteria.location) return 0.8 // 默认分数
  
  const leadLocation = lead.location?.toLowerCase() || ''
  const targetLocation = criteria.location.toLowerCase()
  
  if (leadLocation.includes(targetLocation) || targetLocation.includes(leadLocation)) {
    return 1.0
  }
  
  return 0.3
}

// 计算公司规模匹配分数
function calculateCompanySizeScore(lead: DiscoveredLead, criteria: LeadDiscoveryRequest): number {
  if (!criteria.companySize) return 0.8 // 默认分数
  
  const leadSize = lead.company_size || ''
  const targetSize = criteria.companySize
  
  if (leadSize === targetSize) {
    return 1.0
  }
  
  // 可以添加规模相似度计算
  return 0.5
}

// 计算关键词匹配分数
function calculateKeywordScore(lead: DiscoveredLead, criteria: LeadDiscoveryRequest): number {
  if (!criteria.keywords) return 0.8 // 默认分数

  const keywords = criteria.keywords.split(',').map(k => k.trim().toLowerCase())
  const leadText = `${lead.company_name} ${lead.description} ${lead.industry}`.toLowerCase()

  const matchedKeywords = keywords.filter(keyword => leadText.includes(keyword))

  return matchedKeywords.length / keywords.length
}

// 执行AI分析
async function performAIAnalysis(criteria: LeadDiscoveryRequest, leads: DiscoveredLead[]): Promise<AIAnalysisResult> {
  if (!GEMINI_API_KEY) {
    return {
      summary: '线索发现完成，AI分析功能需要配置Gemini API密钥',
      timestamp: new Date().toISOString(),
      leadsAnalyzed: leads.length,
      recommendations: ['配置Gemini API密钥以启用AI分析功能']
    }
  }

  try {
    const prompt = `
作为一个专业的销售线索分析师，请分析以下线索发现结果：

搜索条件：
- 行业: ${criteria.industry || '未指定'}
- 地区: ${criteria.location || '未指定'}
- 公司规模: ${criteria.companySize || '未指定'}
- 关键词: ${criteria.keywords || '未指定'}

发现的线索数量: ${leads.length}

前5个高分线索:
${leads.slice(0, 5).map((lead, index) => `
${index + 1}. ${lead.company_name}
   - 行业: ${lead.industry}
   - 地区: ${lead.location}
   - 评分: ${lead.scores?.overall || 'N/A'}
   - 匹配原因: ${lead.match_reasons?.join(', ') || 'N/A'}
`).join('')}

请提供：
1. 线索质量总体评估
2. 推荐的优先联系顺序
3. 针对性的销售策略建议
4. 进一步优化搜索条件的建议

请用中文回答，保持专业和实用。
`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      summary: analysisText.substring(0, 500) + (analysisText.length > 500 ? '...' : ''),
      fullAnalysis: analysisText,
      timestamp: new Date().toISOString(),
      leadsAnalyzed: leads.length
    }

  } catch (error) {
    logError('AI分析失败', error)
    return {
      summary: '线索发现完成，AI分析暂时不可用',
      timestamp: new Date().toISOString(),
      leadsAnalyzed: leads.length,
      error: getErrorMessage(error)
    }
  }
}

// 保存发现的线索
async function saveDiscoveredLeads(userId: string, leads: DiscoveredLead[], jobId: string): Promise<void> {
  try {
    const leadsToSave = leads.map(lead => ({
      user_id: userId,
      customer_name: lead.company_name,
      company_name: lead.company_name,
      email: lead.customer_email,
      phone: lead.phone,
      website: lead.customer_website,
      source: 'ai_discovery',
      status: 'new',
      notes: `AI发现线索 - ${lead.description || ''}\n匹配原因: ${lead.match_reasons?.join(', ') || ''}\n置信度: ${lead.discovery_confidence || 0}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('customer_leads')
      .insert(leadsToSave)

    if (error) {
      throw error
    }

  } catch (error) {
    logError('保存发现的线索失败', error)
    throw error
  }
}



// GET请求处理 - 获取发现历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    const { data: jobs, error } = await supabase
      .from('lead_discovery_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({ jobs })

  } catch (error) {
    logError('获取发现历史失败', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
