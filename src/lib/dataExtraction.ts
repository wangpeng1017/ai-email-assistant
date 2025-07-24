// 数据抓取相关的工具函数
import {
  DataExtractionConfig,
  DataExtractionResult,
  DatabaseRecord,
  DataQualityAssessment
} from '@/types'

export interface DataExtractionJob {
  id: string
  userId: string
  extractionType: string
  dataSource: string
  totalRecords: number
  processedRecords: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  errorMessage?: string
  config?: DataExtractionConfig
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface DataExtractionTemplate {
  id: string
  userId: string
  name: string
  description?: string
  extractionType: string
  config: DataExtractionConfig
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API请求重试机制
export async function retryRequest(
  requestFn: () => Promise<Response>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<Response> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await requestFn()
      
      // 如果是服务器错误（5xx）或请求超时，则重试
      if (response.status >= 500 || response.status === 408) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      return response
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        break
      }
      
      // 指数退避延迟
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError!
}

// 数据验证和清理
export function validateAndCleanData(records: DatabaseRecord[]): {
  validRecords: DatabaseRecord[]
  invalidRecords: DatabaseRecord[]
  errors: string[]
} {
  const validRecords: DatabaseRecord[] = []
  const invalidRecords: DatabaseRecord[] = []
  const errors: string[] = []

  records.forEach((record, index) => {
    try {
      const cleanedRecord = cleanDataRecord(record)

      // 基本验证
      if (isValidRecord(cleanedRecord)) {
        validRecords.push(cleanedRecord)
      } else {
        invalidRecords.push(record)
        errors.push(`Record ${index + 1}: Invalid data format`)
      }
    } catch (error) {
      invalidRecords.push(record)
      errors.push(`Record ${index + 1}: ${(error as Error).message}`)
    }
  })

  return { validRecords, invalidRecords, errors }
}

// 数据记录清理
export function cleanDataRecord(record: DatabaseRecord): DatabaseRecord {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid record format')
  }

  const cleaned: DatabaseRecord = {}

  for (const [key, value] of Object.entries(record)) {
    // 清理字段名：移除特殊字符，转换为小写，用下划线替换空格
    const cleanKey = key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')

    if (!cleanKey) continue

    // 清理字段值
    if (value === null || value === undefined) {
      cleaned[cleanKey] = ''
    } else if (typeof value === 'string') {
      cleaned[cleanKey] = value.trim()
    } else if (typeof value === 'number') {
      cleaned[cleanKey] = value
    } else if (typeof value === 'boolean') {
      cleaned[cleanKey] = value
    } else if (Array.isArray(value)) {
      cleaned[cleanKey] = (value as unknown[]).join(', ')
    } else if (typeof value === 'object') {
      cleaned[cleanKey] = JSON.stringify(value)
    } else {
      cleaned[cleanKey] = String(value)
    }
  }

  return cleaned
}

// 验证记录是否有效
export function isValidRecord(record: DatabaseRecord): boolean {
  if (!record || typeof record !== 'object') {
    return false
  }

  // 至少需要有一个非空字段
  const hasValidField = Object.values(record).some(value =>
    value !== null && value !== undefined && String(value).trim() !== ''
  )

  return hasValidField
}

// 字段映射
export function mapFields(record: DatabaseRecord, fieldMapping: Record<string, string>): DatabaseRecord {
  const mapped: DatabaseRecord = {}

  for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
    if (record.hasOwnProperty(sourceField)) {
      mapped[targetField] = record[sourceField]
    }
  }

  // 保留未映射的字段
  for (const [key, value] of Object.entries(record)) {
    if (!fieldMapping.hasOwnProperty(key) && !mapped.hasOwnProperty(key)) {
      mapped[key] = value
    }
  }

  return mapped
}

// 数据转换为线索格式
export function transformToLeadFormat(record: DatabaseRecord): DatabaseRecord {
  const lead: DatabaseRecord = {
    customer_name: '',
    customer_email: '',
    customer_website: '',
    contact_person: '',
    phone: '',
    description: '',
    source: 'data_extraction'
  }

  // 智能字段匹配
  const fieldMappings = {
    // 公司名称
    customer_name: ['company_name', 'company', 'business_name', 'organization', 'name'],
    // 邮箱
    customer_email: ['email', 'email_address', 'contact_email', 'business_email'],
    // 网站
    customer_website: ['website', 'url', 'web_address', 'homepage', 'site'],
    // 联系人
    contact_person: ['contact_person', 'contact_name', 'representative', 'contact'],
    // 电话
    phone: ['phone', 'telephone', 'phone_number', 'contact_phone', 'mobile'],
    // 描述
    description: ['description', 'notes', 'comments', 'details', 'about']
  }

  for (const [targetField, possibleFields] of Object.entries(fieldMappings)) {
    for (const field of possibleFields) {
      if (record[field] && String(record[field]).trim()) {
        lead[targetField] = String(record[field]).trim()
        break
      }
    }
  }

  // 如果没有公司名称，尝试从其他字段推断
  if (!lead.customer_name) {
    const nameFields = Object.keys(record).filter(key => 
      key.includes('name') || key.includes('title') || key.includes('company')
    )
    if (nameFields.length > 0) {
      lead.customer_name = String(record[nameFields[0]]).trim()
    }
  }

  return lead
}

// 批量处理数据
export async function processBatchData<T, R>(
  data: T[],
  batchSize: number = 100,
  processor: (batch: T[]) => Promise<R>
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    try {
      const batchResult = await processor(batch)
      results.push(...(Array.isArray(batchResult) ? batchResult : [batchResult]))
    } catch (error) {
      console.error(`Batch processing error for batch ${i / batchSize + 1}:`, error)
      // 继续处理下一批，不中断整个流程
    }
  }

  return results
}

// 数据质量评估
export function assessDataQuality(records: DatabaseRecord[]): DataQualityAssessment {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 100

  if (records.length === 0) {
    return { score: 0, issues: ['No data found'], recommendations: ['Check data source'] }
  }

  // 检查必需字段的完整性
  const requiredFields = ['customer_name', 'customer_email']
  const fieldCompleteness: Record<string, number> = {}

  requiredFields.forEach(field => {
    const completeness = records.filter(record => 
      record[field] && String(record[field]).trim()
    ).length / records.length

    fieldCompleteness[field] = completeness

    if (completeness < 0.5) {
      score -= 20
      issues.push(`Low completeness for ${field}: ${(completeness * 100).toFixed(1)}%`)
      recommendations.push(`Improve data source to include more ${field} values`)
    }
  })

  // 检查邮箱格式
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const validEmails = records.filter(record =>
    record.customer_email && typeof record.customer_email === 'string' && emailPattern.test(record.customer_email)
  ).length

  const emailValidityRate = validEmails / records.length
  if (emailValidityRate < 0.8) {
    score -= 15
    issues.push(`Low email validity rate: ${(emailValidityRate * 100).toFixed(1)}%`)
    recommendations.push('Validate email formats in data source')
  }

  // 检查重复数据
  const uniqueEmails = new Set(records.map(r => r.customer_email).filter(Boolean))
  const duplicateRate = 1 - (uniqueEmails.size / records.length)
  if (duplicateRate > 0.1) {
    score -= 10
    issues.push(`High duplicate rate: ${(duplicateRate * 100).toFixed(1)}%`)
    recommendations.push('Remove duplicate records before import')
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations
  }
}
