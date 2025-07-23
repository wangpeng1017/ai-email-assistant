import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const description = formData.get('description') as string || ''

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查文件大小 (限制10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小超过10MB限制' },
        { status: 400 }
      )
    }

    // 检查文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型' },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userId}/materials/${fileName}`

    // 上传到Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('product-materials')
      .upload(filePath, file)

    if (uploadError) {
      console.error('文件上传失败:', uploadError)
      return NextResponse.json(
        { success: false, error: '文件上传失败' },
        { status: 500 }
      )
    }

    // 保存文件信息到数据库
    const { data, error: dbError } = await supabase
      .from('product_materials')
      .insert({
        user_id: userId,
        file_name: file.name,
        storage_path: filePath,
        file_type: file.type,
        file_size: file.size,
        description: description || null
      })
      .select()
      .single()

    if (dbError) {
      console.error('数据库保存失败:', dbError)
      // 删除已上传的文件
      await supabase.storage.from('product-materials').remove([filePath])
      return NextResponse.json(
        { success: false, error: '文件信息保存失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '文件上传成功'
    })

  } catch (error) {
    console.error('上传API错误:', error)
    return NextResponse.json(
      { success: false, error: '上传过程中出现错误' },
      { status: 500 }
    )
  }
}

// 获取材料列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('product_materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('获取材料列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取材料列表失败' },
      { status: 500 }
    )
  }
}
