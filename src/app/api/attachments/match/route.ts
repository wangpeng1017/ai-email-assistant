import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { matchAttachments, EmailContent } from '@/lib/attachmentMatcher'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailContent, leadId } = body
    
    // 验证必要参数
    if (!emailContent || !leadId) {
      return NextResponse.json(
        { error: 'Missing required parameters: emailContent, leadId' },
        { status: 400 }
      )
    }
    
    // 验证邮件内容
    if (!emailContent.subject || !emailContent.body) {
      return NextResponse.json(
        { error: 'Invalid email content: missing subject or body' },
        { status: 400 }
      )
    }
    
    // 获取用户信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }
    
    // 获取用户的产品资料
    const { data: materials, error: materialsError } = await supabaseAdmin
      .from('product_materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (materialsError) {
      console.error('Error fetching materials:', materialsError)
      return NextResponse.json(
        { error: 'Failed to fetch product materials' },
        { status: 500 }
      )
    }
    
    if (!materials || materials.length === 0) {
      return NextResponse.json({
        success: true,
        recommendation: {
          matches: [],
          totalMaterials: 0,
          processingTime: 0,
          summary: '您还没有上传任何产品资料。请先上传产品资料以获得智能附件推荐。'
        }
      })
    }
    
    // 获取客户线索信息以丰富邮件内容
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('customer_name, customer_website, source')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()
    
    if (leadError) {
      console.error('Error fetching lead:', leadError)
      // 继续处理，但不包含客户信息
    }
    
    // 构建完整的邮件内容对象
    const enrichedEmailContent: EmailContent = {
      subject: emailContent.subject,
      body: emailContent.body,
      customerName: lead?.customer_name || emailContent.customerName || '未知客户',
      customerWebsite: lead?.customer_website || emailContent.customerWebsite,
      industry: emailContent.industry
    }
    
    // 执行智能匹配
    const recommendation = await matchAttachments(enrichedEmailContent, materials)
    
    // 记录匹配结果到数据库（可选）
    try {
      await supabaseAdmin
        .from('attachment_recommendations')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          email_subject: emailContent.subject,
          total_materials: recommendation.totalMaterials,
          matched_count: recommendation.matches.length,
          processing_time: recommendation.processingTime,
          recommendation_summary: recommendation.summary,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Error logging recommendation:', logError)
      // 不影响主要功能
    }
    
    return NextResponse.json({
      success: true,
      recommendation,
      leadInfo: {
        customerName: enrichedEmailContent.customerName,
        customerWebsite: enrichedEmailContent.customerWebsite
      }
    })
    
  } catch (error) {
    console.error('Error in attachment matching:', error)
    return NextResponse.json(
      { 
        error: 'Failed to match attachments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 获取附件推荐历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // 获取用户信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }
    
    // 构建查询
    let query = supabaseAdmin
      .from('attachment_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (leadId) {
      query = query.eq('lead_id', leadId)
    }
    
    const { data: recommendations, error } = await query
    
    if (error) {
      console.error('Error fetching recommendation history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recommendation history' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      recommendations: recommendations || [],
      count: recommendations?.length || 0
    })
    
  } catch (error) {
    console.error('Error fetching recommendation history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch recommendation history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
