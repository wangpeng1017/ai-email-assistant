import { GoogleGenerativeAI } from '@google/generative-ai'

// 智能附件匹配引擎
const apiKey = process.env.GEMINI_API_KEY || 'placeholder-api-key'
const genAI = new GoogleGenerativeAI(apiKey)

export interface ProductMaterial {
  id: string
  file_name: string
  file_type: string
  storage_path: string
  description?: string
  keywords?: string[]
  created_at: string
}

export interface EmailContent {
  subject: string
  body: string
  customerName: string
  customerWebsite?: string
  industry?: string
}

export interface AttachmentMatch {
  material: ProductMaterial
  relevanceScore: number
  matchReasons: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface AttachmentRecommendation {
  matches: AttachmentMatch[]
  totalMaterials: number
  processingTime: number
  summary: string
}

// 提取邮件内容关键词
export async function extractEmailKeywords(emailContent: EmailContent): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const prompt = `
分析以下邮件内容，提取关键词和主题：

邮件主题: ${emailContent.subject}
邮件正文: ${emailContent.body}
客户名称: ${emailContent.customerName}
客户网站: ${emailContent.customerWebsite || '未知'}
行业: ${emailContent.industry || '未知'}

请提取最重要的关键词，包括：
1. 产品/服务相关词汇
2. 行业术语
3. 技术关键词
4. 业务需求词汇

返回格式：用逗号分隔的关键词列表，不超过20个词汇。
只返回关键词，不要其他解释。
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const keywords = response.text().split(',').map(k => k.trim()).filter(k => k.length > 0)
    
    return keywords.slice(0, 20) // 限制最多20个关键词
  } catch (error) {
    console.error('Error extracting email keywords:', error)
    // 回退到简单的关键词提取
    return extractSimpleKeywords(emailContent)
  }
}

// 简单关键词提取（回退方案）
function extractSimpleKeywords(emailContent: EmailContent): string[] {
  const text = `${emailContent.subject} ${emailContent.body}`.toLowerCase()
  
  // 常见的业务和技术关键词
  const businessKeywords = [
    '自动化', '效率', '管理', '系统', '平台', '解决方案', '服务', '产品',
    '技术', '开发', '设计', '营销', '销售', '客户', '数据', '分析',
    '云计算', '人工智能', 'ai', '机器学习', '大数据', '区块链',
    '移动应用', '网站', '电商', '金融', '教育', '医疗', '制造'
  ]
  
  const foundKeywords = businessKeywords.filter(keyword => 
    text.includes(keyword) || text.includes(keyword.toLowerCase())
  )
  
  // 添加客户名称和行业
  if (emailContent.customerName) {
    foundKeywords.push(emailContent.customerName.toLowerCase())
  }
  if (emailContent.industry) {
    foundKeywords.push(emailContent.industry.toLowerCase())
  }
  
  return foundKeywords.slice(0, 10)
}

// 计算文本相似度
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)
  
  const set1 = new Set(words1)
  const set2 = new Set(words2)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size // Jaccard相似度
}

// 基于关键词匹配计算相关性分数
function calculateKeywordRelevance(
  emailKeywords: string[], 
  material: ProductMaterial
): { score: number; matchedKeywords: string[] } {
  const materialText = `${material.file_name} ${material.description || ''}`.toLowerCase()
  const materialKeywords = material.keywords || []
  
  let score = 0
  const matchedKeywords: string[] = []
  
  // 检查邮件关键词在产品资料中的匹配
  emailKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    
    // 文件名匹配（权重最高）
    if (material.file_name.toLowerCase().includes(keywordLower)) {
      score += 3
      matchedKeywords.push(keyword)
    }
    // 描述匹配
    else if (material.description?.toLowerCase().includes(keywordLower)) {
      score += 2
      matchedKeywords.push(keyword)
    }
    // 关键词匹配
    else if (materialKeywords.some(mk => mk.toLowerCase().includes(keywordLower))) {
      score += 1.5
      matchedKeywords.push(keyword)
    }
  })
  
  // 文件类型相关性加分
  const fileTypeBonus = getFileTypeRelevance(material.file_type, emailKeywords)
  score += fileTypeBonus
  
  return { score, matchedKeywords }
}

// 根据文件类型给出相关性加分
function getFileTypeRelevance(fileType: string, keywords: string[]): number {
  const keywordText = keywords.join(' ').toLowerCase()
  
  if (fileType.includes('pdf')) {
    if (keywordText.includes('文档') || keywordText.includes('说明') || keywordText.includes('手册')) {
      return 1
    }
  }
  
  if (fileType.includes('image')) {
    if (keywordText.includes('图片') || keywordText.includes('展示') || keywordText.includes('产品')) {
      return 1
    }
  }
  
  if (fileType.includes('video')) {
    if (keywordText.includes('演示') || keywordText.includes('视频') || keywordText.includes('介绍')) {
      return 1
    }
  }
  
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    if (keywordText.includes('数据') || keywordText.includes('报表') || keywordText.includes('分析')) {
      return 1
    }
  }
  
  return 0
}

// 生成匹配原因
function generateMatchReasons(
  matchedKeywords: string[], 
  material: ProductMaterial, 
  score: number
): string[] {
  const reasons: string[] = []
  
  if (matchedKeywords.length > 0) {
    reasons.push(`关键词匹配: ${matchedKeywords.slice(0, 3).join(', ')}`)
  }
  
  if (material.file_name.includes('产品') || material.file_name.includes('介绍')) {
    reasons.push('产品介绍相关')
  }
  
  if (material.file_name.includes('案例') || material.file_name.includes('成功')) {
    reasons.push('成功案例展示')
  }
  
  if (material.file_name.includes('价格') || material.file_name.includes('报价')) {
    reasons.push('价格信息相关')
  }
  
  if (score > 5) {
    reasons.push('高度相关内容')
  } else if (score > 2) {
    reasons.push('中等相关内容')
  }
  
  return reasons.length > 0 ? reasons : ['基础匹配']
}

// 确定置信度
function determineConfidence(score: number, matchedKeywords: string[]): 'high' | 'medium' | 'low' {
  if (score >= 5 && matchedKeywords.length >= 2) {
    return 'high'
  } else if (score >= 2 && matchedKeywords.length >= 1) {
    return 'medium'
  } else {
    return 'low'
  }
}

// 主要的智能附件匹配函数
export async function matchAttachments(
  emailContent: EmailContent,
  materials: ProductMaterial[]
): Promise<AttachmentRecommendation> {
  const startTime = Date.now()
  
  try {
    // 提取邮件关键词
    const emailKeywords = await extractEmailKeywords(emailContent)
    console.log('提取的邮件关键词:', emailKeywords)
    
    // 为每个产品资料计算相关性
    const matches: AttachmentMatch[] = []
    
    for (const material of materials) {
      const { score, matchedKeywords } = calculateKeywordRelevance(emailKeywords, material)
      
      if (score > 0) { // 只包含有相关性的资料
        const matchReasons = generateMatchReasons(matchedKeywords, material, score)
        const confidence = determineConfidence(score, matchedKeywords)
        
        matches.push({
          material,
          relevanceScore: score,
          matchReasons,
          confidence
        })
      }
    }
    
    // 按相关性分数排序
    matches.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    // 生成推荐摘要
    const summary = generateRecommendationSummary(matches, emailKeywords)
    
    const processingTime = Date.now() - startTime
    
    return {
      matches: matches.slice(0, 10), // 最多返回10个推荐
      totalMaterials: materials.length,
      processingTime,
      summary
    }
    
  } catch (error) {
    console.error('Error in attachment matching:', error)
    
    // 回退到简单匹配
    const simpleMatches = materials.map(material => ({
      material,
      relevanceScore: 1,
      matchReasons: ['基础匹配'],
      confidence: 'low' as const
    }))
    
    return {
      matches: simpleMatches.slice(0, 5),
      totalMaterials: materials.length,
      processingTime: Date.now() - startTime,
      summary: '使用基础匹配算法推荐附件'
    }
  }
}

// 生成推荐摘要
function generateRecommendationSummary(matches: AttachmentMatch[], keywords: string[]): string {
  if (matches.length === 0) {
    return '未找到相关的产品资料附件'
  }
  
  const highConfidenceCount = matches.filter(m => m.confidence === 'high').length
  const mediumConfidenceCount = matches.filter(m => m.confidence === 'medium').length
  
  let summary = `基于关键词"${keywords.slice(0, 3).join(', ')}"等，`
  
  if (highConfidenceCount > 0) {
    summary += `找到${highConfidenceCount}个高相关性附件`
  }
  
  if (mediumConfidenceCount > 0) {
    if (highConfidenceCount > 0) summary += '，'
    summary += `${mediumConfidenceCount}个中等相关性附件`
  }
  
  summary += `。推荐优先使用前${Math.min(3, matches.length)}个附件。`
  
  return summary
}
