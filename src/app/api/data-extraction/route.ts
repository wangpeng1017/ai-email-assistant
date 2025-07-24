import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getErrorMessage, logError } from '@/lib/errorHandler'
import {
  DataExtractionConfig,
  DataExtractionResult,
  DatabaseRecord,
  LeadRecord
} from '@/types'

// 数据抓取请求接口
interface DataExtractionRequest extends DataExtractionConfig {
  userId: string
}

// API接口数据抓取
async function extractFromAPI(config: DataExtractionRequest): Promise<DataExtractionResult> {
  try {
    const { apiUrl, apiKey, authType, headers = {}, method = 'GET', requestBody } = config

    if (!apiUrl) {
      throw new Error('API URL is required')
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
      signal: AbortSignal.timeout(30000) // 30秒超时
    }

    if (method === 'POST' && requestBody) {
      requestConfig.body = requestBody
    }

    // 发送请求
    const response = await fetch(apiUrl, requestConfig)

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
      data = parseCSV(csvText)
    } else if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
      const xmlText = await response.text()
      data = parseXML(xmlText)
    } else {
      const text = await response.text()
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Unsupported response format')
      }
    }

    // 确保数据是数组格式
    const records = Array.isArray(data) ? data : [data]

    // 验证和清理数据
    const cleanedRecords = records.map(record => cleanDataRecord(record as DatabaseRecord))

    return {
      success: true,
      data: cleanedRecords,
      totalRecords: cleanedRecords.length,
      processedRecords: cleanedRecords.length
    }

  } catch (error) {
    logError('API数据抓取失败', error, { config })
    return {
      success: false,
      errors: [getErrorMessage(error)]
    }
  }
}

// 数据库连接数据抓取
async function extractFromDatabase(config: DataExtractionRequest): Promise<DataExtractionResult> {
  try {
    const { connectionString, query } = config

    if (!connectionString || !query) {
      throw new Error('Database connection string and query are required')
    }

    // 这里实现数据库连接逻辑
    // 由于安全考虑，实际项目中应该使用专门的数据库连接池
    // 目前返回模拟数据

    return {
      success: true,
      data: [],
      totalRecords: 0,
      processedRecords: 0,
      errors: ['Database extraction is not yet implemented']
    }

  } catch (error) {
    logError('数据库数据抓取失败', error, { config })
    return {
      success: false,
      errors: [getErrorMessage(error)]
    }
  }
}

// 文件数据抓取
async function extractFromFile(config: DataExtractionRequest): Promise<DataExtractionResult> {
  try {
    // 文件抓取逻辑将在后续实现
    return {
      success: true,
      data: [],
      totalRecords: 0,
      processedRecords: 0,
      errors: ['File extraction is not yet implemented']
    }

  } catch (error) {
    logError('文件数据抓取失败', error, { config })
    return {
      success: false,
      errors: [getErrorMessage(error)]
    }
  }
}

// CSV解析函数
function parseCSV(csvText: string): DatabaseRecord[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const records: DatabaseRecord[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const record: DatabaseRecord = {}

    headers.forEach((header, index) => {
      record[header] = values[index] || ''
    })

    records.push(record)
  }

  return records
}

// XML解析函数（简化版）
function parseXML(_xmlText: string): DatabaseRecord[] {
  // 这里应该使用专门的XML解析库
  // 目前返回空数组，实际项目中需要实现完整的XML解析
  return []
}

// 数据清理函数
function cleanDataRecord(record: DatabaseRecord): DatabaseRecord {
  const cleaned: DatabaseRecord = {}

  for (const [key, value] of Object.entries(record)) {
    // 清理字段名
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')

    // 清理字段值
    if (typeof value === 'string') {
      cleaned[cleanKey] = value.trim()
    } else {
      cleaned[cleanKey] = value
    }
  }

  return cleaned
}

// 保存抓取结果到数据库
async function saveExtractionResults(userId: string, results: DataExtractionResult, config: DataExtractionRequest) {
  try {
    if (!results.success || !results.data) return

    // 保存抓取任务记录
    const { data: job, error: jobError } = await supabase
      .from('data_extraction_jobs')
      .insert({
        user_id: userId,
        extraction_type: config.extractionType,
        data_source: config.dataSource,
        total_records: results.totalRecords,
        processed_records: results.processedRecords,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    // 保存抓取的数据（转换为线索格式）
    const leads: Partial<LeadRecord>[] = results.data.map(record => ({
      user_id: userId,
      customer_name: String(record.company_name || record.name || record.customer_name || 'Unknown'),
      customer_email: String(record.email || record.customer_email || ''),
      customer_website: String(record.website || record.url || record.customer_website || ''),
      contact_person: String(record.contact_person || record.contact || ''),
      phone: String(record.phone || record.telephone || ''),
      description: String(record.description || record.notes || ''),
      source: 'data_extraction',
      extraction_job_id: job.id,
      created_at: new Date().toISOString()
    }))

    const { error: leadsError } = await supabase
      .from('leads')
      .insert(leads)

    if (leadsError) {
      throw leadsError
    }

    return job.id

  } catch (error) {
    logError('保存抓取结果失败', error, { userId, config })
    throw error
  }
}

// POST请求处理
export async function POST(request: NextRequest) {
  try {
    const body: DataExtractionRequest = await request.json()
    
    // 验证必需字段
    if (!body.userId || !body.extractionType || !body.dataSource) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, extractionType, dataSource' },
        { status: 400 }
      )
    }

    let results: DataExtractionResult

    // 根据抓取类型执行相应的抓取逻辑
    switch (body.extractionType) {
      case 'api':
        results = await extractFromAPI(body)
        break
      case 'database':
        results = await extractFromDatabase(body)
        break
      case 'file':
        results = await extractFromFile(body)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid extraction type' },
          { status: 400 }
        )
    }

    // 如果抓取成功，保存结果到数据库
    if (results.success && results.data && results.data.length > 0) {
      try {
        const jobId = await saveExtractionResults(body.userId, results, body)
        results.jobId = jobId
      } catch (saveError) {
        logError('保存抓取结果时出错', saveError, { body })
        // 不影响抓取结果的返回，只记录错误
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    logError('数据抓取API错误', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// GET请求处理 - 获取抓取历史
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
      .from('data_extraction_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({ jobs })

  } catch (error) {
    logError('获取抓取历史失败', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
