import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const buffer = await file.arrayBuffer()
    let data: Array<Array<string | number>> = []

    if (file.name.endsWith('.csv')) {
      // 处理CSV文件
      const text = new TextDecoder().decode(buffer)
      const lines = text.split('\n').filter(line => line.trim())
      data = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))
    } else {
      // 处理Excel文件
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as Array<Array<string | number>>
    }

    if (data.length < 2) {
      return NextResponse.json(
        { success: false, error: '文件内容为空或格式不正确' },
        { status: 400 }
      )
    }

    // 解析标题行
    const headers = data[0].map(h => String(h).toLowerCase().trim())
    const rows = data.slice(1)

    // 映射列索引
    const columnMap = {
      customer_name: findColumnIndex(headers, ['客户姓名', '姓名', 'name', 'customer_name']),
      company_name: findColumnIndex(headers, ['公司名称', '公司', 'company', 'company_name']),
      email: findColumnIndex(headers, ['邮箱', '邮箱地址', 'email', 'mail']),
      phone: findColumnIndex(headers, ['电话', '电话号码', 'phone', 'tel', 'mobile']),
      website: findColumnIndex(headers, ['网站', '网站地址', 'website', 'url']),
      notes: findColumnIndex(headers, ['备注', '说明', 'notes', 'remark'])
    }

    if (columnMap.customer_name === -1) {
      return NextResponse.json(
        { success: false, error: '未找到客户姓名列，请确保文件包含客户姓名信息' },
        { status: 400 }
      )
    }

    // 准备导入数据
    const leadsToImport = []
    const now = new Date().toISOString()

    for (const row of rows) {
      const customerName = row[columnMap.customer_name]?.toString().trim()
      if (!customerName) continue

      const leadData = {
        user_id: userId,
        customer_name: customerName,
        company_name: columnMap.company_name !== -1 ? row[columnMap.company_name]?.toString().trim() || null : null,
        email: columnMap.email !== -1 ? row[columnMap.email]?.toString().trim() || null : null,
        phone: columnMap.phone !== -1 ? row[columnMap.phone]?.toString().trim() || null : null,
        website: columnMap.website !== -1 ? row[columnMap.website]?.toString().trim() || null : null,
        source: 'excel_import',
        status: 'new',
        notes: columnMap.notes !== -1 ? row[columnMap.notes]?.toString().trim() || null : null,
        created_at: now,
        updated_at: now
      }

      leadsToImport.push(leadData)
    }

    if (leadsToImport.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有找到有效的数据行' },
        { status: 400 }
      )
    }

    // 尝试插入到customer_leads表
    // eslint-disable-next-line prefer-const
    let { data: insertedData, error: insertError } = await supabase
      .from('customer_leads')
      .insert(leadsToImport)
      .select()

    // 如果customer_leads表不存在，回退到leads表
    if (insertError && insertError.message.includes('relation "public.customer_leads" does not exist')) {
      console.log('customer_leads表不存在，回退到leads表')
      
      const leadsData = leadsToImport.map(lead => ({
        user_id: lead.user_id,
        customer_name: lead.customer_name,
        customer_email: lead.email,
        customer_website: lead.website,
        source: 'excel',
        status: 'pending',
        notes: lead.notes,
        created_at: lead.created_at,
        updated_at: lead.updated_at
      }))

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('leads')
        .insert(leadsData)
        .select()

      if (fallbackError) {
        throw fallbackError
      }

      insertedData = fallbackData
    } else if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      count: insertedData?.length || 0,
      message: `成功导入 ${insertedData?.length || 0} 条线索`
    })

  } catch (error) {
    console.error('导入线索失败:', error)
    return NextResponse.json(
      { success: false, error: '导入失败，请检查文件格式' },
      { status: 500 }
    )
  }
}

// 辅助函数：查找列索引
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name.toLowerCase()))
    if (index !== -1) return index
  }
  return -1
}
