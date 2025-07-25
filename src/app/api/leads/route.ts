import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getErrorMessage, logError } from '@/lib/errorHandler'

// 获取线索列表
export async function GET(request: NextRequest) {
  // 添加调试日志
  console.log('🔍 Leads API GET request received')
  console.log('Request URL:', request.url)

  let userId: string | null = null

  try {
    const { searchParams } = new URL(request.url)
    userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('📊 Query parameters:', { userId, status, source, search, page, limit })

    // 健康检查端点
    if (searchParams.get('health') === 'check') {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Leads API is working'
      })
    }

    if (!userId) {
      console.log('❌ Missing userId parameter')
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    // 首先尝试从customer_leads表获取数据
    console.log('🔍 Querying customer_leads table...')
    let query = supabase
      .from('customer_leads')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 应用过滤器
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (source && source !== 'all') {
      query = query.eq('source', source)
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // 应用分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    let data: unknown[] | null = null
    let count: number | null = null
    let error: Error | null = null

    try {
      console.log('📊 Executing customer_leads query...')
      const result = await query
      data = result.data
      count = result.count
      error = result.error as Error | null
      console.log('✅ Query result:', { dataCount: data?.length, totalCount: count, hasError: !!error })
    } catch (e) {
      console.error('❌ Query execution failed:', e)
      error = e as Error
    }

    // 如果customer_leads表不存在，回退到leads表
    if (error && 'message' in error && error.message.includes('relation "public.customer_leads" does not exist')) {
      console.log('customer_leads表不存在，回退到leads表')
      
      let leadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // 应用过滤器（需要映射状态）
      if (status && status !== 'all') {
        const mappedStatus = mapNewStatusToOld(status)
        leadsQuery = leadsQuery.eq('status', mappedStatus)
      }

      if (source && source !== 'all') {
        const mappedSource = mapNewSourceToOld(source)
        leadsQuery = leadsQuery.eq('source', mappedSource)
      }

      if (search) {
        leadsQuery = leadsQuery.or(`customer_name.ilike.%${search}%,customer_website.ilike.%${search}%,customer_email.ilike.%${search}%`)
      }

      // 应用分页
      leadsQuery = leadsQuery.range(from, to)

      const { data: leadsData, error: leadsError, count: leadsCount } = await leadsQuery

      if (leadsError) throw leadsError

      // 映射leads表数据到新格式
      data = leadsData?.map(lead => ({
        id: lead.id,
        user_id: lead.user_id,
        customer_name: lead.customer_name || 'Unknown',
        company_name: lead.customer_website || '',
        email: lead.customer_email || '',
        phone: lead.phone || '',
        website: lead.customer_website || '',
        source: mapOldSourceToNew(lead.source),
        status: mapOldStatusToNew(lead.status),
        notes: lead.notes || '',
        industry: '',
        company_size: '',
        created_at: lead.created_at,
        updated_at: lead.updated_at || lead.created_at
      })) || []
      
      count = leadsCount
    } else if (error) {
      throw error
    }

    // 计算分页信息
    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('❌ 线索API错误详情:', {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId
    })

    logError('获取线索列表失败', error)

    // 提供更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : String(error)
    let userFriendlyMessage = getErrorMessage(error)

    // 如果是数据库相关错误，提供更具体的信息
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      userFriendlyMessage = '数据库表不存在，请联系管理员初始化数据库'
    } else if (errorMessage.includes('invalid input syntax for type uuid')) {
      userFriendlyMessage = '用户ID格式错误，请重新登录'
    } else if (errorMessage.includes('permission denied')) {
      userFriendlyMessage = '权限不足，请重新登录'
    }

    return NextResponse.json(
      {
        error: userFriendlyMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// 创建新线索
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, customer_name, company_name, email, phone, website, notes, source = 'manual' } = body

    if (!userId || !customer_name) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, customer_name' },
        { status: 400 }
      )
    }

    const leadData = {
      user_id: userId,
      customer_name: customer_name.trim(),
      company_name: company_name?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      source,
      status: 'new',
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 首先尝试添加到customer_leads表
    // eslint-disable-next-line prefer-const
    let { data, error } = await supabase
      .from('customer_leads')
      .insert([leadData])
      .select()
      .single()

    // 如果customer_leads表不存在，回退到leads表
    if (error && error.message.includes('relation "public.customer_leads" does not exist')) {
      console.log('customer_leads表不存在，回退到leads表')
      
      const leadsData = {
        user_id: leadData.user_id,
        customer_name: leadData.customer_name,
        customer_email: leadData.email,
        customer_website: leadData.website,
        source: mapNewSourceToOld(leadData.source),
        status: mapNewStatusToOld(leadData.status),
        notes: leadData.notes,
        created_at: leadData.created_at,
        updated_at: leadData.updated_at
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('leads')
        .insert([leadsData])
        .select()
        .single()

      if (fallbackError) {
        throw fallbackError
      }

      data = fallbackData
    } else if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
      message: '线索创建成功'
    })

  } catch (error) {
    logError('创建线索失败', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// 状态映射函数
function mapNewStatusToOld(newStatus: string): string {
  const statusMap: Record<string, string> = {
    'new': 'pending',
    'contacted': 'processing',
    'qualified': 'completed',
    'converted': 'completed',
    'lost': 'failed'
  }
  return statusMap[newStatus] || 'pending'
}

function mapOldStatusToNew(oldStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'new',
    'processing': 'contacted',
    'completed': 'qualified',
    'failed': 'lost'
  }
  return statusMap[oldStatus] || 'new'
}

function mapNewSourceToOld(newSource: string): string {
  const sourceMap: Record<string, string> = {
    'manual': 'manual',
    'excel_import': 'excel',
    'scraped': 'scraped',
    'ai_discovery': 'scraped'
  }
  return sourceMap[newSource] || 'manual'
}

function mapOldSourceToNew(oldSource: string): string {
  const sourceMap: Record<string, string> = {
    'manual': 'manual',
    'excel': 'excel_import',
    'scraped': 'scraped'
  }
  return sourceMap[oldSource] || 'manual'
}
