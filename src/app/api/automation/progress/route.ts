import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    
    if (!batchId) {
      return NextResponse.json(
        { error: 'Missing batchId parameter' },
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
    
    // 获取批处理进度
    const { data: progress, error } = await supabaseAdmin
      .from('batch_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json({
          status: 'not_found',
          message: 'Batch not found'
        })
      }
      
      console.error('Error fetching batch progress:', error)
      return NextResponse.json(
        { error: 'Failed to fetch batch progress' },
        { status: 500 }
      )
    }
    
    // 构造进度响应
    const response = {
      status: progress.status,
      totalItems: progress.total_items,
      completedItems: progress.completed_items,
      failedItems: progress.failed_items,
      currentStep: progress.current_step,
      currentItem: progress.current_item,
      message: `Processing ${progress.current_item || 'items'}...`,
      completedSteps: [], // 这里可以根据current_step计算已完成的步骤
      failedSteps: [],
      stepProgress: Math.round((progress.completed_items / progress.total_items) * 100),
      estimatedEndTime: null, // 可以根据处理速度估算
      results: progress.status === 'completed' ? { 
        completedItems: progress.completed_items,
        failedItems: progress.failed_items,
        totalItems: progress.total_items
      } : null,
      error: progress.error_message
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error in progress check:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
