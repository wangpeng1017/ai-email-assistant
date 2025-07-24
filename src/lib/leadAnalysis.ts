// 线索分析和评分相关的工具函数
import {
  LeadScore,
  SimilarityFactors,
  LeadAnalysisResult,
  SimilarCompany,
  DiscoveredLead,
  LeadDiscoveryRequest
} from '@/types'

// 计算线索综合评分
export function calculateLeadScore(
  lead: DiscoveredLead,
  criteria: LeadDiscoveryRequest
): LeadScore {
  const industryScore = calculateIndustryScore(lead, criteria)
  const locationScore = calculateLocationScore(lead, criteria)
  const companySizeScore = calculateCompanySizeScore(lead, criteria)
  const engagementScore = calculateEngagementScore(lead)
  const aiConfidence = calculateAIConfidence(lead, criteria)

  const overall = (
    industryScore * 0.3 +
    locationScore * 0.2 +
    companySizeScore * 0.15 +
    engagementScore * 0.2 +
    aiConfidence * 0.15
  )

  return {
    overall: Math.round(overall * 100) / 100,
    industry: Math.round(industryScore * 100) / 100,
    location: Math.round(locationScore * 100) / 100,
    companySize: Math.round(companySizeScore * 100) / 100,
    engagement: Math.round(engagementScore * 100) / 100,
    aiConfidence: Math.round(aiConfidence * 100) / 100
  }
}

// 计算行业匹配分数
function calculateIndustryScore(lead: DiscoveredLead, criteria: LeadDiscoveryRequest): number {
  if (!criteria.industry) return 0.8

  const leadIndustry = (lead.industry || '').toLowerCase()
  const targetIndustry = criteria.industry.toLowerCase()

  // 精确匹配
  if (leadIndustry === targetIndustry) return 1.0

  // 包含匹配
  if (leadIndustry.includes(targetIndustry) || targetIndustry.includes(leadIndustry)) {
    return 0.9
  }

  // 相关行业匹配
  const relatedIndustries = getRelatedIndustries(targetIndustry)
  for (const related of relatedIndustries) {
    if (leadIndustry.includes(related.toLowerCase())) {
      return 0.7
    }
  }

  return 0.3
}

// 计算地理位置匹配分数
function calculateLocationScore(lead: DiscoveredLead, criteria: LeadDiscoveryRequest): number {
  if (!criteria.location) return 0.8

  const leadLocation = (lead.location || '').toLowerCase()
  const targetLocation = criteria.location.toLowerCase()

  // 精确匹配
  if (leadLocation === targetLocation) return 1.0

  // 包含匹配
  if (leadLocation.includes(targetLocation) || targetLocation.includes(leadLocation)) {
    return 0.9
  }

  // 同一地区匹配
  const sameRegion = checkSameRegion(leadLocation, targetLocation)
  if (sameRegion) return 0.6

  return 0.3
}

// 计算公司规模匹配分数
function calculateCompanySizeScore(lead: DiscoveredLead, criteria: LeadDiscoveryRequest): number {
  if (!criteria.companySize) return 0.8

  const leadSize = lead.company_size || ''
  const targetSize = criteria.companySize

  // 精确匹配
  if (leadSize === targetSize) return 1.0

  // 相邻规模匹配
  const sizeOrder = ['1-10人', '11-50人', '51-200人', '201-500人', '500+人']
  const leadIndex = sizeOrder.indexOf(leadSize)
  const targetIndex = sizeOrder.indexOf(targetSize)

  if (leadIndex !== -1 && targetIndex !== -1) {
    const diff = Math.abs(leadIndex - targetIndex)
    if (diff === 1) return 0.8
    if (diff === 2) return 0.6
  }

  return 0.4
}

// 计算参与度分数
function calculateEngagementScore(lead: DiscoveredLead): number {
  let score = 0.5 // 基础分数

  // 有网站加分
  if (lead.customer_website && lead.customer_website.trim()) {
    score += 0.2
  }

  // 有联系人加分
  if (lead.contact_person && lead.contact_person.trim()) {
    score += 0.1
  }

  // 有电话加分
  if (lead.phone && lead.phone.trim()) {
    score += 0.1
  }

  // 有详细描述加分
  if (lead.description && lead.description.length > 50) {
    score += 0.1
  }

  return Math.min(score, 1.0)
}

// 计算AI置信度
function calculateAIConfidence(lead: DiscoveredLead, _criteria: LeadDiscoveryRequest): number {
  let confidence = 0.5

  // 基于匹配原因的置信度
  if (lead.match_reasons && lead.match_reasons.length > 0) {
    confidence += lead.match_reasons.length * 0.1
  }

  // 基于发现置信度
  if (lead.discovery_confidence) {
    confidence = (confidence + lead.discovery_confidence) / 2
  }

  // 基于数据完整性
  const completeness = calculateDataCompleteness(lead)
  confidence = (confidence + completeness) / 2

  return Math.min(confidence, 1.0)
}

// 计算数据完整性
function calculateDataCompleteness(lead: DiscoveredLead): number {
  const fields = [
    'company_name',
    'customer_email',
    'customer_website',
    'contact_person',
    'phone',
    'description',
    'industry',
    'location'
  ]

  const completedFields = fields.filter(field => {
    const value = (lead as unknown as Record<string, unknown>)[field]
    return value && String(value).trim().length > 0
  }).length

  return completedFields / fields.length
}

// 查找相似公司
export function findSimilarCompanies(
  targetLead: DiscoveredLead,
  allLeads: DiscoveredLead[],
  maxResults: number = 5
): SimilarCompany[] {
  const similarities = allLeads
    .filter(lead => lead.id !== targetLead.id)
    .map(lead => {
      const factors = calculateSimilarityFactors(targetLead, lead)
      const similarity = calculateOverallSimilarity(factors)
      
      return { lead, similarity, factors }
    })
    .filter(item => item.similarity > 0.3) // 只返回相似度大于30%的
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)

  return similarities
}

// 计算相似度因子
function calculateSimilarityFactors(lead1: DiscoveredLead, lead2: DiscoveredLead): SimilarityFactors {
  return {
    industryMatch: calculateFieldSimilarity(lead1.industry || '', lead2.industry || ''),
    locationMatch: calculateFieldSimilarity(lead1.location || '', lead2.location || ''),
    sizeMatch: calculateFieldSimilarity(lead1.company_size || '', lead2.company_size || ''),
    keywordMatch: calculateKeywordSimilarity(lead1.description || '', lead2.description || ''),
    websiteMatch: calculateWebsiteSimilarity(lead1.customer_website || '', lead2.customer_website || '')
  }
}

// 计算字段相似度
function calculateFieldSimilarity(field1: string, field2: string): number {
  if (!field1 || !field2) return 0

  const f1 = field1.toLowerCase().trim()
  const f2 = field2.toLowerCase().trim()

  if (f1 === f2) return 1.0
  if (f1.includes(f2) || f2.includes(f1)) return 0.8

  return 0
}

// 计算关键词相似度
function calculateKeywordSimilarity(desc1: string, desc2: string): number {
  if (!desc1 || !desc2) return 0

  const words1 = desc1.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const words2 = desc2.toLowerCase().split(/\s+/).filter(w => w.length > 3)

  if (words1.length === 0 || words2.length === 0) return 0

  const commonWords = words1.filter(word => words2.includes(word))
  return commonWords.length / Math.max(words1.length, words2.length)
}

// 计算网站相似度
function calculateWebsiteSimilarity(website1: string, website2: string): number {
  if (!website1 || !website2) return 0

  try {
    const domain1 = new URL(website1).hostname.replace('www.', '')
    const domain2 = new URL(website2).hostname.replace('www.', '')

    if (domain1 === domain2) return 1.0

    // 检查是否是同一公司的不同子域
    const parts1 = domain1.split('.')
    const parts2 = domain2.split('.')

    if (parts1.length >= 2 && parts2.length >= 2) {
      const mainDomain1 = parts1.slice(-2).join('.')
      const mainDomain2 = parts2.slice(-2).join('.')
      
      if (mainDomain1 === mainDomain2) return 0.8
    }

    return 0
  } catch {
    return 0
  }
}

// 计算总体相似度
function calculateOverallSimilarity(factors: SimilarityFactors): number {
  return (
    factors.industryMatch * 0.3 +
    factors.locationMatch * 0.2 +
    factors.sizeMatch * 0.15 +
    factors.keywordMatch * 0.2 +
    factors.websiteMatch * 0.15
  )
}

// 获取相关行业
function getRelatedIndustries(industry: string): string[] {
  const relatedMap: Record<string, string[]> = {
    '科技': ['互联网', '软件', 'IT', '人工智能', '大数据'],
    '互联网': ['科技', '软件', '电商', '移动应用'],
    '金融': ['银行', '保险', '投资', '证券', 'fintech'],
    '医疗': ['健康', '制药', '生物技术', '医疗器械'],
    '教育': ['培训', '在线教育', '学校', '教学'],
    '制造': ['工业', '生产', '制造业', '机械'],
    '零售': ['电商', '销售', '商业', '购物']
  }

  const lowerIndustry = industry.toLowerCase()
  for (const [key, related] of Object.entries(relatedMap)) {
    if (lowerIndustry.includes(key.toLowerCase())) {
      return related
    }
  }

  return []
}

// 检查是否在同一地区
function checkSameRegion(location1: string, location2: string): boolean {
  const regions = [
    ['北京', '天津', '河北'],
    ['上海', '江苏', '浙江'],
    ['广州', '深圳', '广东'],
    ['成都', '重庆', '四川'],
    ['西安', '陕西'],
    ['武汉', '湖北'],
    ['杭州', '浙江'],
    ['南京', '江苏']
  ]

  for (const region of regions) {
    const in1 = region.some(city => location1.includes(city))
    const in2 = region.some(city => location2.includes(city))
    if (in1 && in2) return true
  }

  return false
}

// 生成线索分析报告
export function generateLeadAnalysisReport(
  lead: DiscoveredLead,
  scores: LeadScore,
  similarCompanies: SimilarCompany[],
  _criteria: LeadDiscoveryRequest
): LeadAnalysisResult {
  const recommendations = generateRecommendations(lead, scores)
  const riskFactors = identifyRiskFactors(lead, scores)
  const nextActions = suggestNextActions(lead, scores)

  return {
    leadId: lead.id || '',
    scores,
    similarCompanies: similarCompanies.map(item => item.lead.id || ''),
    recommendations,
    riskFactors,
    nextActions
  }
}

// 生成推荐建议
function generateRecommendations(lead: DiscoveredLead, scores: LeadScore): string[] {
  const recommendations = []

  if (scores.overall > 0.8) {
    recommendations.push('高质量线索，建议优先联系')
  } else if (scores.overall > 0.6) {
    recommendations.push('中等质量线索，可以考虑联系')
  } else {
    recommendations.push('低质量线索，建议进一步验证')
  }

  if (scores.industry < 0.5) {
    recommendations.push('行业匹配度较低，需要调整销售策略')
  }

  if (scores.engagement < 0.5) {
    recommendations.push('缺少关键联系信息，建议补充完善')
  }

  if (!lead.customer_website) {
    recommendations.push('缺少网站信息，建议通过其他渠道验证公司')
  }

  return recommendations
}

// 识别风险因素
function identifyRiskFactors(lead: DiscoveredLead, scores: LeadScore): string[] {
  const risks = []

  if (scores.aiConfidence < 0.5) {
    risks.push('AI置信度较低，数据可能不准确')
  }

  if (!lead.customer_email || !lead.customer_email.includes('@')) {
    risks.push('邮箱格式可能有误')
  }

  if (scores.engagement < 0.3) {
    risks.push('联系信息不完整，可能难以建立联系')
  }

  if (scores.overall < 0.4) {
    risks.push('整体匹配度较低，转化可能性小')
  }

  return risks
}

// 建议下一步行动
function suggestNextActions(lead: DiscoveredLead, scores: LeadScore): string[] {
  const actions = []

  if (scores.overall > 0.7) {
    actions.push('发送个性化邮件介绍产品')
    actions.push('安排电话沟通')
  } else if (scores.overall > 0.5) {
    actions.push('发送产品介绍资料')
    actions.push('关注公司动态')
  } else {
    actions.push('补充完善线索信息')
    actions.push('验证联系方式有效性')
  }

  if (!lead.contact_person) {
    actions.push('查找关键决策人联系方式')
  }

  if (!lead.phone) {
    actions.push('获取公司电话号码')
  }

  return actions
}
