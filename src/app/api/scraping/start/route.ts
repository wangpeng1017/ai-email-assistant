import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface ScrapedLead {
  company_name: string
  website_url: string
  email?: string
  description?: string
}

// 网页爬取API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetUrl, crawlDepth = 1, maxResults = 50, userId } = body

    if (!targetUrl || !userId) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      )
    }

    // 验证URL格式
    let url: URL
    try {
      url = new URL(targetUrl)
    } catch {
      return NextResponse.json(
        { error: '无效的URL格式' },
        { status: 400 }
      )
    }

    // 只允许HTTP和HTTPS协议
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json(
        { error: '只支持HTTP和HTTPS协议' },
        { status: 400 }
      )
    }

    const leads: ScrapedLead[] = []
    const visitedUrls = new Set<string>()
    const urlsToVisit = [targetUrl]

    // 爬取网页内容
    for (let depth = 0; depth < crawlDepth && urlsToVisit.length > 0 && leads.length < maxResults; depth++) {
      const currentLevelUrls = [...urlsToVisit]
      urlsToVisit.length = 0

      for (const currentUrl of currentLevelUrls) {
        if (visitedUrls.has(currentUrl) || leads.length >= maxResults) {
          continue
        }

        visitedUrls.add(currentUrl)

        try {
          // 获取网页内容
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

          const response = await fetch(currentUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            console.warn(`无法访问 ${currentUrl}: ${response.status}`)
            continue
          }

          const html = await response.text()
          const $ = cheerio.load(html)

          // 提取公司信息的多种策略
          const extractedLeads = extractCompanyInfo($, currentUrl)
          leads.push(...extractedLeads)

          // 如果需要更深层爬取，收集下一层的链接
          if (depth < crawlDepth - 1) {
            $('a[href]').each((_, element) => {
              const href = $(element).attr('href')
              if (href) {
                try {
                  const absoluteUrl = new URL(href, currentUrl).toString()
                  const linkUrl = new URL(absoluteUrl)
                  
                  // 只爬取同域名的链接
                  if (linkUrl.hostname === url.hostname && !visitedUrls.has(absoluteUrl)) {
                    urlsToVisit.push(absoluteUrl)
                  }
                } catch {
                  // 忽略无效链接
                }
              }
            })
          }
        } catch (error) {
          console.warn(`爬取 ${currentUrl} 时出错:`, error)
          continue
        }
      }
    }

    // 去重和清理数据
    const uniqueLeads = deduplicateLeads(leads.slice(0, maxResults))

    return NextResponse.json({
      leads: uniqueLeads,
      totalFound: uniqueLeads.length,
      pagesVisited: visitedUrls.size
    })

  } catch (error) {
    console.error('爬取API错误:', error)
    return NextResponse.json(
      { error: '爬取过程中出现错误' },
      { status: 500 }
    )
  }
}

// 提取公司信息的函数
function extractCompanyInfo($: cheerio.Root, baseUrl: string): ScrapedLead[] {
  const leads: ScrapedLead[] = []
  const companyPatterns = [
    // 常见的公司列表选择器
    '.company-item',
    '.company-card',
    '.business-item',
    '.listing-item',
    '.directory-item',
    '[class*="company"]',
    '[class*="business"]',
    '[class*="listing"]'
  ]

  // 尝试不同的选择器模式
  for (const pattern of companyPatterns) {
    $(pattern).each((_, element) => {
      const $element = $(element)
      const lead = extractLeadFromElement($element, $, baseUrl)
      if (lead) {
        leads.push(lead)
      }
    })
    
    if (leads.length > 0) break // 如果找到了数据，就不再尝试其他模式
  }

  // 如果没有找到结构化数据，尝试通用方法
  if (leads.length === 0) {
    leads.push(...extractGenericCompanyInfo($, baseUrl))
  }

  return leads
}

// 从元素中提取线索信息
function extractLeadFromElement($element: any, $: cheerio.Root, baseUrl: string): ScrapedLead | null {
  // 提取公司名称
  const nameSelectors = ['h1', 'h2', 'h3', '.name', '.title', '.company-name', '[class*="name"]']
  let companyName = ''
  
  for (const selector of nameSelectors) {
    const nameElement = $element.find(selector).first()
    if (nameElement.length > 0) {
      companyName = nameElement.text().trim()
      if (companyName) break
    }
  }

  // 提取网站链接
  let websiteUrl = ''
  const linkElement = $element.find('a[href]').first()
  if (linkElement.length > 0) {
    const href = linkElement.attr('href')
    if (href) {
      try {
        websiteUrl = new URL(href, baseUrl).toString()
      } catch {
        websiteUrl = href
      }
    }
  }

  // 提取邮箱
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const elementText = $element.text()
  const emailMatch = elementText.match(emailRegex)
  const email = emailMatch ? emailMatch[0] : undefined

  // 提取描述
  const descriptionSelectors = ['.description', '.summary', '.about', 'p']
  let description = ''
  
  for (const selector of descriptionSelectors) {
    const descElement = $element.find(selector).first()
    if (descElement.length > 0) {
      description = descElement.text().trim().substring(0, 200)
      if (description) break
    }
  }

  // 验证数据质量
  if (!companyName || companyName.length < 2) {
    return null
  }

  return {
    company_name: companyName,
    website_url: websiteUrl || baseUrl,
    email,
    description: description || undefined
  }
}

// 通用公司信息提取
function extractGenericCompanyInfo($: cheerio.Root, baseUrl: string): ScrapedLead[] {
  const leads: ScrapedLead[] = []
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  
  // 查找包含邮箱的元素
  $('*').each((_, element) => {
    const $element = $(element)
    const text = $element.text()
    const emailMatch = text.match(emailRegex)
    
    if (emailMatch) {
      // 尝试找到相关的公司名称
      const parentElement = $element.closest('div, section, article, li')
      const companyName = parentElement.find('h1, h2, h3, .name, .title').first().text().trim()
      
      if (companyName && companyName.length > 2) {
        leads.push({
          company_name: companyName,
          website_url: baseUrl,
          email: emailMatch[0],
          description: text.substring(0, 200).trim()
        })
      }
    }
  })

  return leads.slice(0, 10) // 限制通用提取的数量
}

// 去重函数
function deduplicateLeads(leads: ScrapedLead[]): ScrapedLead[] {
  const seen = new Set<string>()
  const uniqueLeads: ScrapedLead[] = []

  for (const lead of leads) {
    // 使用公司名称和网站URL作为唯一标识
    const key = `${lead.company_name.toLowerCase()}-${lead.website_url}`
    
    if (!seen.has(key)) {
      seen.add(key)
      uniqueLeads.push(lead)
    }
  }

  return uniqueLeads
}
