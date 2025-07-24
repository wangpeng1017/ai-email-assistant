// 共享类型定义

// 基础数据类型
export interface DatabaseRecord {
  [key: string]: string | number | boolean | null | undefined
}

export interface LeadRecord {
  id?: string
  company_name: string
  customer_email: string
  customer_website: string
  contact_person: string
  phone: string
  description: string
  industry?: string
  location?: string
  company_size?: string
  source: string
  extraction_job_id?: string
  discovery_job_id?: string
  created_at?: string
  updated_at?: string
}

// 数据抓取相关类型
export interface DataExtractionConfig {
  extractionType: 'api' | 'database' | 'file'
  dataSource: string
  
  // API配置
  apiUrl?: string
  apiKey?: string
  authType?: 'api-key' | 'bearer' | 'oauth2' | 'basic'
  headers?: Record<string, string>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH'
  requestBody?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  
  // 数据库配置
  databaseType?: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite'
  connectionString?: string
  query?: string
  tableName?: string
  conditions?: Record<string, unknown>
  
  // 文件配置
  filePath?: string
  fileType?: 'csv' | 'json' | 'xml' | 'excel'
  encoding?: string
  delimiter?: string
  hasHeader?: boolean
  
  // 通用配置
  batchSize?: number
  maxRecords?: number
  fieldMapping?: Record<string, string>
  dataTransformation?: Record<string, unknown>
}

export interface DataExtractionResult {
  success: boolean
  data?: DatabaseRecord[]
  totalRecords?: number
  processedRecords?: number
  errors?: string[]
  warnings?: string[]
  jobId?: string
  metadata?: {
    extractionTime: number
    dataSource: string
    extractionType: string
    timestamp: string
  }
}

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

// 线索发现相关类型
export interface LeadDiscoveryRequest {
  industry: string
  location: string
  companySize: string
  keywords: string
  userId: string
  maxResults?: number
  includeAnalysis?: boolean
}

export interface DiscoveredLead extends LeadRecord {
  discovery_confidence?: number
  match_reasons?: string[]
  scores?: {
    overall: number
    industry: number
    location: number
    companySize: number
    keyword: number
  }
}

export interface LeadDiscoveryResponse {
  success: boolean
  discoveredLeads?: DiscoveredLead[]
  totalDiscovered?: number
  processedLeads?: number
  aiAnalysis?: AIAnalysisResult
  jobId?: string
  errors?: string[]
}

export interface AIAnalysisResult {
  summary: string
  fullAnalysis?: string
  timestamp: string
  leadsAnalyzed: number
  recommendations?: string[]
  error?: string
}

export interface LeadDiscoveryJob {
  id: string
  userId: string
  searchCriteria: {
    industry?: string
    location?: string
    companySize?: string
    keywords?: string
    maxResults?: number
  }
  totalDiscovered: number
  processedLeads: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  errorMessage?: string
  aiAnalysis?: AIAnalysisResult
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// 线索评分相关类型
export interface LeadScore {
  overall: number
  industry: number
  location: number
  companySize: number
  engagement: number
  aiConfidence: number
}

export interface SimilarityFactors {
  industryMatch: number
  locationMatch: number
  sizeMatch: number
  keywordMatch: number
  websiteMatch: number
}

export interface SimilarCompany {
  lead: LeadRecord
  similarity: number
  factors: SimilarityFactors
}

export interface LeadAnalysisResult {
  leadId: string
  scores: LeadScore
  similarCompanies: string[]
  recommendations: string[]
  riskFactors: string[]
  nextActions: string[]
}

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TestConnectionResult {
  success: boolean
  message: string
  details?: {
    status?: number
    contentType?: string
    server?: string
    note?: string
  }
}

export interface PreviewDataResult {
  success: boolean
  data: DatabaseRecord[]
  message: string
  metadata?: {
    totalRecords: number
    contentType?: string
    databaseType?: string
    fileType?: string
    errors?: string[]
    note?: string
  }
}

// 表单相关类型
export interface FormErrors {
  [key: string]: string
}

export interface ValidationResult {
  isValid: boolean
  errors: FormErrors
}

// 通用工具类型
export type Status = 'idle' | 'loading' | 'success' | 'error'

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams {
  query?: string
  filters?: Record<string, unknown>
  pagination?: PaginationParams
}

// 数据质量评估类型
export interface DataQualityAssessment {
  score: number
  issues: string[]
  recommendations: string[]
  fieldCompleteness?: Record<string, number>
  duplicateRate?: number
  emailValidityRate?: number
}

// 批处理类型
export interface BatchProcessResult<T> {
  processed: T[]
  failed: T[]
  errors: string[]
  totalProcessed: number
  totalFailed: number
}

// 环境变量类型
export interface EnvironmentConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  geminiApiKey?: string
  nodeEnv: string
}
