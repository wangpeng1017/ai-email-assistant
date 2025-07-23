import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 获取产品资料列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('product_materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取产品资料失败:', error)
      return NextResponse.json(
        { error: '获取产品资料失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ materials: data })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 创建产品资料记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fileName, storagePath, fileType, fileSize, description, keywords } = body

    if (!userId || !fileName || !storagePath) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('product_materials')
      .insert({
        user_id: userId,
        file_name: fileName,
        storage_path: storagePath,
        file_type: fileType,
        file_size: fileSize,
        description,
        keywords
      })
      .select()
      .single()

    if (error) {
      console.error('创建产品资料记录失败:', error)
      return NextResponse.json(
        { error: '创建产品资料记录失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ material: data })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 删除产品资料
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!materialId || !userId) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      )
    }

    // 首先获取文件信息
    const { data: material, error: fetchError } = await supabase
      .from('product_materials')
      .select('storage_path')
      .eq('id', materialId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !material) {
      return NextResponse.json(
        { error: '找不到指定的产品资料' },
        { status: 404 }
      )
    }

    // 从Storage删除文件
    const { error: storageError } = await supabase.storage
      .from('product-materials')
      .remove([material.storage_path])

    if (storageError) {
      console.error('Storage删除失败:', storageError)
      // 继续删除数据库记录，即使Storage删除失败
    }

    // 从数据库删除记录
    const { error: dbError } = await supabase
      .from('product_materials')
      .delete()
      .eq('id', materialId)
      .eq('user_id', userId)

    if (dbError) {
      console.error('数据库删除失败:', dbError)
      return NextResponse.json(
        { error: '删除产品资料失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
