import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 数据库连接测试开始')
    
    // 测试基本连接
    const { data: connectionTest, error: connectionError } = await supabase
      .from('customer_leads')
      .select('count', { count: 'exact', head: true })
    
    if (connectionError) {
      console.error('❌ customer_leads表连接失败:', connectionError)
      
      // 尝试连接备用表
      const { data: backupTest, error: backupError } = await supabase
        .from('leads')
        .select('count', { count: 'exact', head: true })
        
      if (backupError) {
        console.error('❌ leads表连接也失败:', backupError)
        return NextResponse.json({
          success: false,
          error: 'Database connection failed',
          details: {
            customer_leads_error: connectionError.message,
            leads_error: backupError.message
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Connected to backup leads table',
        tables: {
          customer_leads: 'not_available',
          leads: 'available'
        },
        backup_count: backupTest
      })
    }
    
    // 测试其他表
    const { data: materialsTest, error: materialsError } = await supabase
      .from('product_materials')
      .select('count', { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tables: {
        customer_leads: 'available',
        product_materials: materialsError ? 'error' : 'available'
      },
      counts: {
        customer_leads: connectionTest,
        product_materials: materialsTest
      },
      errors: {
        materials_error: materialsError?.message
      }
    })
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
