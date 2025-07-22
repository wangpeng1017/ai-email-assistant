import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, validateSupabaseConfig } from '@/lib/supabase'
import { analyzeWebsite } from '@/lib/webAnalyzer'
import { generateEmailContent, validateGeminiConfig } from '@/lib/aiGenerator'

export async function POST(request: NextRequest) {
  try {
    // 验证环境配置
    validateSupabaseConfig()
    validateGeminiConfig()

    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: '缺少线索ID' }, { status: 400 })
    }

    // 获取线索信息
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: '线索不存在' }, { status: 404 })
    }

    // 更新状态为处理中
    await supabaseAdmin
      .from('leads')
      .update({ status: 'processing' })
      .eq('id', leadId)

    // 异步处理（不等待完成）
    processLead(lead).catch(error => {
      console.error('处理线索失败:', error)
    })

    return NextResponse.json({ message: '自动化处理已启动' })

  } catch (error) {
    console.error('启动自动化处理失败:', error)
    return NextResponse.json(
      { error: '启动失败' },
      { status: 500 }
    )
  }
}

async function processLead(lead: {
  id: string
  user_id: string
  customer_website: string
  customer_name: string
  customer_email: string
}) {
  try {
    // 1. 分析客户网站
    console.log(`开始分析网站: ${lead.customer_website}`)
    const websiteAnalysis = await analyzeWebsite(lead.customer_website)

    // 2. 获取产品资料（如果有的话）
    let productMaterials = ''
    const { data: materials } = await supabaseAdmin
      .from('product_materials')
      .select('*')
      .eq('user_id', lead.user_id)
      .limit(5)

    if (materials && materials.length > 0) {
      // 这里可以从存储中读取文件内容
      // 暂时使用文件名作为产品信息
      productMaterials = materials.map(m => m.file_name).join(', ')
    }

    // 3. 生成邮件内容
    console.log(`开始生成邮件内容`)
    const emailContent = await generateEmailContent(
      websiteAnalysis,
      lead.customer_name,
      lead.customer_email,
      productMaterials
    )

    // 4. 更新线索状态和生成的内容
    await supabaseAdmin
      .from('leads')
      .update({
        status: 'completed',
        generated_mail_subject: emailContent.subject,
        generated_mail_body: emailContent.body,
        error_message: null
      })
      .eq('id', lead.id)

    console.log(`线索 ${lead.id} 处理完成`)

  } catch (error) {
    console.error(`处理线索 ${lead.id} 失败:`, error)
    
    // 更新错误状态
    await supabaseAdmin
      .from('leads')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : '处理失败'
      })
      .eq('id', lead.id)
  }
}
