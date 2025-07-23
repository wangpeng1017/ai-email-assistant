import { createClient } from '@supabase/supabase-js'

// 环境变量清理和验证函数
function cleanUrl(url: string | undefined): string {
  if (!url) return 'https://placeholder.supabase.co'

  // 移除末尾的斜杠和空格
  const cleaned = url.trim().replace(/\/+$/, '')

  // 验证URL格式
  try {
    new URL(cleaned)
    return cleaned
  } catch {
    console.warn(`Invalid Supabase URL format: ${url}`)
    return 'https://placeholder.supabase.co'
  }
}

function cleanKey(key: string | undefined, placeholder: string): string {
  if (!key) return placeholder
  return key.trim()
}

// 清理和验证环境变量
const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = cleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'placeholder-anon-key')
const supabaseServiceKey = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY, 'placeholder-service-key')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that require elevated permissions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 运行时验证函数
export function validateSupabaseConfig() {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  // 在生产环境和开发环境都进行验证
  if (isProduction || isDevelopment) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // 验证URL
    if (!rawUrl || rawUrl.includes('placeholder') || rawUrl.trim() === '') {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL environment variable is not properly configured. Current value: "${rawUrl}"`)
    }

    // 验证URL格式
    try {
      const cleanedUrl = cleanUrl(rawUrl)
      if (cleanedUrl.includes('placeholder')) {
        throw new Error(`NEXT_PUBLIC_SUPABASE_URL has invalid format: "${rawUrl}"`)
      }
    } catch {
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${rawUrl}"`)
    }

    // 验证匿名密钥
    if (!rawAnonKey || rawAnonKey.includes('placeholder') || rawAnonKey.trim() === '') {
      throw new Error(`NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not properly configured. Current value: "${rawAnonKey}"`)
    }

    // 验证服务密钥（仅在生产环境强制要求）
    if (isProduction && (!rawServiceKey || rawServiceKey.includes('placeholder') || rawServiceKey.trim() === '')) {
      throw new Error(`SUPABASE_SERVICE_ROLE_KEY environment variable is not properly configured. Current value: "${rawServiceKey}"`)
    }

    console.log('✅ Supabase configuration validated successfully')
    console.log(`📍 Supabase URL: ${cleanUrl(rawUrl)}`)
  }
}

// 导出配置信息用于调试
export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey && !supabaseAnonKey.includes('placeholder'),
    hasServiceKey: !!supabaseServiceKey && !supabaseServiceKey.includes('placeholder'),
    environment: process.env.NODE_ENV
  }
}
