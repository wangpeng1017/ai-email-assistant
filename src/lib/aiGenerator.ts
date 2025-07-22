import { GoogleGenerativeAI } from '@google/generative-ai'
import { WebsiteAnalysis } from './webAnalyzer'

const apiKey = process.env.GEMINI_API_KEY || 'placeholder-api-key'
const genAI = new GoogleGenerativeAI(apiKey)

// 运行时验证函数
export function validateGeminiConfig() {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('placeholder')) {
      throw new Error('GEMINI_API_KEY environment variable is not properly configured')
    }
  }
}

export interface EmailContent {
  subject: string
  body: string
  collaborationPoints: string[]
}

export async function generateEmailContent(
  websiteAnalysis: WebsiteAnalysis,
  customerName: string,
  customerEmail: string,
  productMaterials?: string
): Promise<EmailContent> {
  try {
    console.log(`开始为 ${customerName} 生成邮件内容`)

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })

    const prompt = `
作为一名专业的商务邮件撰写专家，请基于以下客户信息生成一封个性化的商务合作邮件。

客户信息：
- 公司/网站：${websiteAnalysis.title}
- 联系人：${customerName}
- 邮箱：${customerEmail}
- 公司描述：${websiteAnalysis.description}
- 详细业务信息：${websiteAnalysis.businessInfo}

${productMaterials ? `我方产品/服务信息：\n${productMaterials}\n` : `我方是一家专业的技术服务公司，提供数字化解决方案和技术咨询服务。`}

请生成一封专业的商务邮件，包含：

1. 邮件标题：简洁有吸引力，体现合作价值
2. 邮件正文：
   - 礼貌的开头问候
   - 简要介绍我方公司和服务
   - 基于客户业务特点的个性化合作建议
   - 具体的价值主张
   - 专业的结尾和联系方式

要求：
- 语调专业、友好、不过于销售化
- 体现对客户业务的深入理解
- 突出双方合作的互补性和价值
- 邮件长度适中（300-500字）
- 使用中文撰写

请严格按照以下JSON格式返回，确保JSON格式正确：
{
  "subject": "邮件标题",
  "body": "完整的邮件正文内容",
  "collaborationPoints": ["合作建议1", "合作建议2", "合作建议3"]
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('AI生成的原始响应:', text.substring(0, 200) + '...')

    // 尝试解析JSON响应
    try {
      // 查找JSON内容
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[0]
        console.log('提取的JSON字符串:', jsonStr)

        const emailContent = JSON.parse(jsonStr)

        const result = {
          subject: emailContent.subject || '商务合作咨询',
          body: emailContent.body || '邮件生成失败，请重试',
          collaborationPoints: Array.isArray(emailContent.collaborationPoints)
            ? emailContent.collaborationPoints
            : []
        }

        console.log(`邮件内容生成成功 - 标题: ${result.subject}`)
        return result
      }
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      console.log('原始文本:', text)
    }

    // 如果JSON解析失败，尝试从文本中提取内容
    console.log('JSON解析失败，尝试文本解析')

    const lines = text.split('\n').filter(line => line.trim())
    let subject = '商务合作咨询'
    let body = text.replace(/```json|```/g, '').trim()
    const collaborationPoints: string[] = []

    // 简单的文本解析逻辑
    for (const line of lines) {
      if (line.includes('标题') || line.includes('subject')) {
        const match = line.match(/[:：](.+)/)
        if (match) subject = match[1].trim().replace(/["""]/g, '')
      }
    }

    // 如果body太短，使用默认模板
    if (body.length < 100) {
      body = `尊敬的${customerName}，

您好！

我是来自专业技术服务公司的商务代表。通过了解贵公司的业务情况，我们认为双方在技术服务和数字化解决方案方面存在很好的合作机会。

基于贵公司的业务特点，我们可以为您提供：
- 定制化的技术解决方案
- 专业的咨询服务
- 持续的技术支持

期待与您进一步沟通合作事宜。

此致
敬礼！

商务团队`
    }

    return {
      subject,
      body,
      collaborationPoints
    }

  } catch (error) {
    console.error('AI内容生成失败:', error)
    throw new Error(`AI内容生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

export async function analyzeBusinessSynergy(
  customerBusiness: string,
  ourProducts: string
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' })

    const prompt = `
请分析以下两个业务之间的潜在合作点：

客户业务：
${customerBusiness}

我方产品/服务：
${ourProducts}

请提供3-5个具体的合作建议，每个建议应该：
1. 明确指出合作的切入点
2. 说明对双方的价值
3. 具有可操作性

请以数组格式返回，每个元素是一个合作建议。
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // 简单解析合作点
    const points = text
      .split('\n')
      .filter(line => line.trim() && (line.includes('1.') || line.includes('2.') || line.includes('3.') || line.includes('4.') || line.includes('5.')))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(point => point.length > 10)

    return points.length > 0 ? points : ['基于双方业务特点，建议探讨深度合作机会']

  } catch (error) {
    console.error('业务协同分析失败:', error)
    return ['基于双方业务特点，建议探讨深度合作机会']
  }
}
