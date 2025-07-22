import { createClient } from '@supabase/supabase-js'

// 使用默认值避免构建时错误
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that require elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
)

// 运行时验证函数
export function validateSupabaseConfig() {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not properly configured')
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not properly configured')
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not configured - admin operations will not work')
    }
  }
}
