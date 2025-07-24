import { NextRequest, NextResponse } from 'next/server'
import { getErrorMessage, logError } from '@/lib/errorHandler'
import { retryRequest, validateAndCleanData } from '@/lib/dataExtraction'
import { PreviewDataResult, DataExtractionConfig, DatabaseRecord } from '@/types'

interface PreviewDataRequest extends DataExtractionConfig {
  userId: string
  maxRecords?: number
}

// 数据预览API
export async function POST(request: NextRequest) {
  try {
    const body: PreviewDataRequest = await request.json()
    const { extractionType, userId, maxRecords = 10 } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    let previewResult: PreviewDataResult = { success: false, data: [], message: '' }

    switch (extractionType) {
      case 'api':
        previewResult = await previewApiData(body, maxRecords)
        break
      case 'database':
        previewResult = await previewDatabaseData(body, maxRecords)
        break
      case 'file':
        previewResult = await previewFileData(body, maxRecords)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid extraction type' },
          { status: 400 }
        )
    }

    return NextResponse.json(previewResult)

  } catch (error) {
    logError(error, '数据预览失败')
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// 预览API数据
async function previewApiData(config: PreviewDataRequest, maxRecords: number): Promise<PreviewDataResult> {
  try {
    const { apiUrl, apiKey, authType, headers = {}, method = 'GET', requestBody } = config

    if (!apiUrl) {
      return { success: false, data: [], message: 'API URL is required' }
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

    // 构建请求配置
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(15000) // 15秒超时
    }

    if (method === 'POST' && requestBody) {
      requestConfig.body = requestBody
    }

    // 发送请求
    const response = await retryRequest(
      () => fetch(apiUrl, requestConfig),
      2, // 最多重试2次
      1000 // 1秒延迟
    )

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    let data: unknown

    // 解析响应数据
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else if (contentType?.includes('text/csv')) {
      const csvText = await response.text()
      data = parseCSVPreview(csvText, maxRecords)
    } else if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
      const xmlText = await response.text()
      data = parseXMLPreview(xmlText, maxRecords)
    } else {
      const text = await response.text()
      try {
        data = JSON.parse(text)
      } catch {
        return {
          success: false,
          data: [],
          message: 'Unsupported response format'
        }
      }
    }

    // 确保数据是数组格式并限制记录数
    let records = Array.isArray(data) ? data : [data]
    records = records.slice(0, maxRecords)

    // 验证和清理数据
    const { validRecords, errors } = validateAndCleanData(records)

    return {
      success: true,
      data: validRecords,
      message: `成功获取 ${validRecords.length} 条预览记录`,
      metadata: {
        totalRecords: validRecords.length,
        contentType: contentType || undefined,
        errors: errors.slice(0, 5) // 只显示前5个错误
      }
    }

  } catch (error) {
    return {
      success: false,
      data: [],
      message: `API预览失败: ${getErrorMessage(error)}`
    }
  }
}

// 预览数据库数据
async function previewDatabaseData(config: PreviewDataRequest, maxRecords: number): Promise<PreviewDataResult> {
  try {
    const { databaseType, connectionString, query } = config

    if (!connectionString || !query) {
      return { 
        success: false, 
        data: [], 
        message: 'Database connection string and query are required' 
      }
    }

    // 这里应该实现实际的数据库查询预览
    // 暂时返回模拟数据
    const mockData = generateMockDatabaseData(databaseType || 'mysql', maxRecords)

    return {
      success: true,
      data: mockData,
      message: `数据库预览功能正在开发中，显示模拟数据 ${mockData.length} 条`,
      metadata: {
        totalRecords: mockData.length,
        databaseType,
        note: '这是模拟数据，实际功能正在开发中'
      }
    }

  } catch (error) {
    return {
      success: false,
      data: [],
      message: `数据库预览失败: ${getErrorMessage(error)}`
    }
  }
}

// 预览文件数据
async function previewFileData(config: PreviewDataRequest, maxRecords: number): Promise<PreviewDataResult> {
  try {
    const { filePath, fileType } = config

    if (!filePath) {
      return { 
        success: false, 
        data: [], 
        message: 'File path is required' 
      }
    }

    // 文件预览逻辑
    // 暂时返回模拟数据
    const mockData = generateMockFileData(fileType || 'csv', maxRecords)

    return {
      success: true,
      data: mockData,
      message: `文件预览功能正在开发中，显示模拟数据 ${mockData.length} 条`,
      metadata: {
        totalRecords: mockData.length,
        fileType,
        note: '这是模拟数据，实际功能正在开发中'
      }
    }

  } catch (error) {
    return {
      success: false,
      data: [],
      message: `文件预览失败: ${getErrorMessage(error)}`
    }
  }
}

// CSV预览解析
function parseCSVPreview(csvText: string, maxRecords: number): DatabaseRecord[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const records: DatabaseRecord[] = []

  for (let i = 1; i < Math.min(lines.length, maxRecords + 1); i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const record: DatabaseRecord = {}

    headers.forEach((header, index) => {
      record[header] = values[index] || ''
    })

    records.push(record)
  }

  return records
}

// XML预览解析（简化版）
function parseXMLPreview(_xmlText: string, _maxRecords: number): DatabaseRecord[] {
  // 简化的XML解析，实际项目中应使用专门的XML解析库
  return []
}

// 生成模拟数据库数据
function generateMockDatabaseData(databaseType: string, count: number): DatabaseRecord[] {
  const mockData = []
  for (let i = 1; i <= count; i++) {
    mockData.push({
      id: i,
      company_name: `Company ${i}`,
      email: `contact${i}@company${i}.com`,
      website: `https://company${i}.com`,
      contact_person: `Contact Person ${i}`,
      phone: `+1-555-000${i.toString().padStart(4, '0')}`,
      industry: ['Technology', 'Healthcare', 'Finance', 'Education'][i % 4],
      location: ['New York', 'San Francisco', 'London', 'Tokyo'][i % 4]
    })
  }
  return mockData
}

// 生成模拟文件数据
function generateMockFileData(fileType: string, count: number): DatabaseRecord[] {
  const mockData = []
  for (let i = 1; i <= count; i++) {
    mockData.push({
      company_name: `File Company ${i}`,
      email: `file${i}@example.com`,
      website: `https://filecompany${i}.com`,
      contact_person: `File Contact ${i}`,
      phone: `+1-555-100${i.toString().padStart(4, '0')}`,
      description: `This is a sample company from ${fileType} file`
    })
  }
  return mockData
}
