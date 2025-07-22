import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, validateSupabaseConfig } from '@/lib/supabase'
import { analyzeWebsite } from '@/lib/webAnalyzer'
import { generateEmailContent, validateGeminiConfig } from '@/lib/aiGenerator'

export async function POST(request: NextRequest) {
  try {
    // 验证环境配置
    validateSupabaseConfig()
    validateGeminiConfig()

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    // 获取所有待处理的线索
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (leadsError) {
      return NextResponse.json({ error: '获取线索失败' }, { status: 500 })
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: '没有待处理的线索' })
    }

    // 更新所有线索状态为处理中
    await supabaseAdmin
      .from('leads')
      .update({ status: 'processing' })
      .eq('user_id', userId)
      .eq('status', 'pending')

    // 异步批量处理
    processBatchLeads(leads, userId).catch(error => {
      console.error('批量处理失败:', error)
    })

    return NextResponse.json({ 
      message: `已启动批量处理，共 ${leads.length} 个线索`,
      count: leads.length
    })

  } catch (error) {
    console.error('启动批量处理失败:', error)
    return NextResponse.json(
      { error: '启动失败' },
      { status: 500 }
    )
  }
}

async function processBatchLeads(leads: Array<{
  id: string
  user_id: string
  customer_website: string
  customer_name: string
  customer_email: string
}>, userId: string) {
  // 获取用户的产品资料
  let productMaterials = ''
  const { data: materials } = await supabaseAdmin
    .from('product_materials')
    .select('*')
    .eq('user_id', userId)
    .limit(5)

  if (materials && materials.length > 0) {
    productMaterials = materials.map(m => m.file_name).join(', ')
  }

  // 并发处理线索（限制并发数量以避免API限制）
  const concurrencyLimit = 3
  const chunks = []
  
  for (let i = 0; i < leads.length; i += concurrencyLimit) {
    chunks.push(leads.slice(i, i + concurrencyLimit))
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(lead => processIndividualLead(lead, productMaterials))
    )
    
    // 在处理下一批之前稍作延迟
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log(`批量处理完成，共处理 ${leads.length} 个线索`)
}

async function processIndividualLead(lead: {
  id: string
  user_id: string
  customer_website: string
  customer_name: string
  customer_email: string
}, productMaterials: string) {
  try {
    console.log(`开始处理线索: ${lead.id} - ${lead.customer_name}`)

    // 1. 分析客户网站
    const websiteAnalysis = await analyzeWebsite(lead.customer_website)

    // 2. 生成邮件内容
    const emailContent = await generateEmailContent(
      websiteAnalysis,
      lead.customer_name,
      lead.customer_email,
      productMaterials
    )

    // 3. 更新线索状态
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
