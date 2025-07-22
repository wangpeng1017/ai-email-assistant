import axios from 'axios'
import * as cheerio from 'cheerio'

export interface WebsiteAnalysis {
  title: string
  description: string
  content: string
  businessInfo: string
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  try {
    // 确保URL格式正确
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    console.log(`开始分析网站: ${url}`)

    // 获取网页内容
    const response = await axios.get(url, {
      timeout: 15000, // 增加超时时间
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })

    const html = response.data
    const $ = cheerio.load(html)

    // 提取基本信息
    const title = $('title').text().trim() ||
                  $('h1').first().text().trim() ||
                  $('h2').first().text().trim() ||
                  '未找到标题'

    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="Description"]').attr('content') ||
                       $('.description').first().text().trim() ||
                       $('p').first().text().trim().substring(0, 200) ||
                       '未找到描述'

    // 提取主要内容
    let content = ''

    // 移除不需要的标签
    $('script, style, nav, footer, header, .nav, .footer, .header, .menu, .sidebar').remove()

    // 提取主要文本内容
    const mainSelectors = [
      'main', '.main', '#main',
      '.content', '#content', '.main-content',
      '.container', '.wrapper',
      'article', '.article',
      '.about', '.intro', '.introduction',
      '.company-info', '.business'
    ]

    let mainContent = ''

    for (const selector of mainSelectors) {
      const element = $(selector)
      if (element.length > 0 && element.text().trim().length > 100) {
        mainContent = element.text().trim()
        break
      }
    }

    // 如果没有找到主要内容区域，提取body中的文本
    if (!mainContent || mainContent.length < 100) {
      mainContent = $('body').text().trim()
    }

    // 清理和截取内容
    content = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\t+/g, ' ')
      .trim()
      .substring(0, 3000) // 增加长度限制

    // 提取业务相关信息
    const businessKeywords = [
      '公司', '企业', '服务', '产品', '业务', '解决方案',
      '关于我们', '我们是', '专业', '提供', '致力于',
      'company', 'business', 'service', 'product', 'solution',
      'about us', 'we are', 'we provide', 'professional'
    ]

    let businessInfo = ''

    // 优先查找关于我们页面的内容
    const aboutSelectors = ['.about', '#about', '.company', '.intro', '.introduction']
    for (const selector of aboutSelectors) {
      const aboutElement = $(selector)
      if (aboutElement.length > 0 && aboutElement.text().trim().length > 100) {
        businessInfo = aboutElement.text().trim().substring(0, 1500)
        break
      }
    }

    // 如果没有找到专门的关于页面，查找包含业务关键词的段落
    if (!businessInfo) {
      $('p, div, section, .card, .item').each((_, element) => {
        const text = $(element).text().trim()
        if (text.length > 80 && businessKeywords.some(keyword =>
          text.toLowerCase().includes(keyword.toLowerCase()))) {
          businessInfo += text + ' '
          if (businessInfo.length > 1500) return false
        }
      })
    }

    // 最后的备选方案
    if (!businessInfo || businessInfo.length < 100) {
      businessInfo = content.substring(0, 800)
    }

    const result = {
      title: title.substring(0, 200),
      description: description.substring(0, 500),
      content: content.substring(0, 3000),
      businessInfo: businessInfo.trim().substring(0, 1500)
    }

    console.log(`网站分析完成: ${url}`)
    console.log(`标题: ${result.title}`)
    console.log(`描述长度: ${result.description.length}`)
    console.log(`内容长度: ${result.content.length}`)
    console.log(`业务信息长度: ${result.businessInfo.length}`)

    return result

  } catch (error) {
    console.error('网页分析失败:', error)

    // 提供更详细的错误信息
    let errorMessage = '网页分析失败'
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = '网页访问超时，请检查网址是否正确'
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = '无法找到该网站，请检查网址是否正确'
      } else if (error.message.includes('403')) {
        errorMessage = '网站拒绝访问，可能有反爬虫保护'
      } else if (error.message.includes('404')) {
        errorMessage = '网页不存在，请检查网址是否正确'
      } else {
        errorMessage = `网页分析失败: ${error.message}`
      }
    }

    throw new Error(errorMessage)
  }
}
