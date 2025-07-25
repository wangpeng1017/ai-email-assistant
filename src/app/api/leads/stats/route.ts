import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getErrorMessage, logError } from '@/lib/errorHandler'

// 获取线索统计信息
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

    let stats = {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0
    }

    try {
      // 首先尝试从customer_leads表获取统计数据
      const { data, error } = await supabase
        .from('customer_leads')
        .select('status')
        .eq('user_id', userId)

      if (error && error.message.includes('relation "public.customer_leads" does not exist')) {
        console.log('customer_leads表不存在，回退到leads表')
        
        // 回退到leads表
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('status')
          .eq('user_id', userId)

        if (leadsError) throw leadsError

        // 映射旧状态到新状态并统计
        const mappedData = leadsData?.map(lead => ({
          status: mapOldStatusToNew(lead.status)
        })) || []

        stats = calculateStats(mappedData)
      } else if (error) {
        throw error
      } else {
        stats = calculateStats(data || [])
      }

    } catch (error) {
      logError('获取线索统计失败', error)
      // 返回默认统计数据而不是错误，避免阻塞UI
      stats = {
        total: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    logError('线索统计API错误', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// 计算统计数据
function calculateStats(data: { status: string }[]) {
  const stats = {
    total: data.length,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0
  }

  data.forEach(item => {
    switch (item.status) {
      case 'new':
        stats.new++
        break
      case 'contacted':
        stats.contacted++
        break
      case 'qualified':
        stats.qualified++
        break
      case 'converted':
        stats.converted++
        break
      case 'lost':
        stats.lost++
        break
    }
  })

  return stats
}

// 状态映射函数
function mapOldStatusToNew(oldStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'new',
    'processing': 'contacted',
    'completed': 'qualified',
    'failed': 'lost'
  }
  return statusMap[oldStatus] || 'new'
}
