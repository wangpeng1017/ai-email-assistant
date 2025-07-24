import { NextRequest, NextResponse } from 'next/server'
import { getErrorMessage, logError } from '@/lib/errorHandler'
import { TestConnectionResult, DataExtractionConfig } from '@/types'

interface TestConnectionRequest extends DataExtractionConfig {
  userId: string
}

// 测试数据源连接
export async function POST(request: NextRequest) {
  try {
    const body: TestConnectionRequest = await request.json()
    const { extractionType, userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    let testResult: TestConnectionResult = { success: false, message: '' }

    switch (extractionType) {
      case 'api':
        testResult = await testApiConnection(body)
        break
      case 'database':
        testResult = await testDatabaseConnection(body)
        break
      case 'file':
        testResult = await testFileAccess(body)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid extraction type' },
          { status: 400 }
        )
    }

    return NextResponse.json(testResult)

  } catch (error) {
    logError('测试连接失败', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// 测试API连接
async function testApiConnection(config: TestConnectionRequest): Promise<TestConnectionResult> {
  try {
    const { apiUrl, apiKey, authType, headers = {}, method = 'GET' } = config

    if (!apiUrl) {
      return { success: false, message: 'API URL is required' }
    }

    // 验证URL格式
    try {
      new URL(apiUrl)
    } catch {
      return { success: false, message: 'Invalid API URL format' }
    }

    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Email-Assistant/1.0',
      ...headers
    }

    // 添加认证信息
    if (apiKey && authType) {
      switch (authType) {
        case 'api-key':
          requestHeaders['X-API-Key'] = apiKey
          break
        case 'bearer':
          requestHeaders['Authorization'] = `Bearer ${apiKey}`
          break
        case 'oauth2':
          requestHeaders['Authorization'] = `OAuth ${apiKey}`
          break
        case 'basic':
          requestHeaders['Authorization'] = `Basic ${apiKey}`
          break
      }
    }

    // 发送测试请求
    const response = await fetch(apiUrl, {
      method: method === 'POST' ? 'HEAD' : 'HEAD', // 使用HEAD请求测试连接
      headers: requestHeaders,
      signal: AbortSignal.timeout(10000) // 10秒超时
    })

    if (response.ok) {
      return { 
        success: true, 
        message: `API连接成功 (状态码: ${response.status})`,
        details: {
          status: response.status,
          contentType: response.headers.get('content-type') || undefined,
          server: response.headers.get('server') || undefined
        }
      }
    } else {
      return { 
        success: false, 
        message: `API连接失败: ${response.status} ${response.statusText}` 
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, message: '连接超时，请检查API地址和网络连接' }
      }
      return { success: false, message: `连接错误: ${error.message}` }
    }
    return { success: false, message: '未知连接错误' }
  }
}

// 测试数据库连接
async function testDatabaseConnection(config: TestConnectionRequest): Promise<TestConnectionResult> {
  try {
    const { databaseType, connectionString } = config

    if (!connectionString) {
      return { success: false, message: 'Database connection string is required' }
    }

    // 这里应该实现实际的数据库连接测试
    // 由于安全考虑，暂时返回模拟结果
    
    // 基本的连接字符串格式验证
    const patterns = {
      mysql: /^mysql:\/\/.*:.*@.*:\d+\/.*$/,
      postgresql: /^postgresql:\/\/.*:.*@.*:\d+\/.*$/,
      mongodb: /^mongodb:\/\/.*$/
    }

    const pattern = patterns[databaseType as keyof typeof patterns]
    if (pattern && !pattern.test(connectionString)) {
      return { 
        success: false, 
        message: `Invalid ${databaseType} connection string format` 
      }
    }

    // 模拟连接测试
    await new Promise(resolve => setTimeout(resolve, 1000))

    return { 
      success: true, 
      message: `${databaseType} 连接字符串格式正确`,
      details: {
        note: '实际数据库连接功能正在开发中'
      }
    }

  } catch (error) {
    return { 
      success: false, 
      message: `数据库连接测试失败: ${getErrorMessage(error)}` 
    }
  }
}

// 测试文件访问
async function testFileAccess(config: TestConnectionRequest): Promise<TestConnectionResult> {
  try {
    const { filePath } = config

    if (!filePath) {
      return { success: false, message: 'File path is required' }
    }

    // 文件访问测试逻辑
    // 暂时返回模拟结果
    return { 
      success: true, 
      message: '文件路径格式正确',
      details: {
        note: '文件抓取功能正在开发中'
      }
    }

  } catch (error) {
    return { 
      success: false, 
      message: `文件访问测试失败: ${getErrorMessage(error)}` 
    }
  }
}
