import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('收到文件上传请求')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const description = formData.get('description') as string || ''

    console.log('上传参数:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: userId,
      description: description
    })

    if (!file || !userId) {
      console.error('缺少必要参数:', { file: !!file, userId: !!userId })
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

    // 检查文件类型 - 扩展支持更多文件类型
    const allowedTypes = [
      // 文档类型
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      // 文本类型
      'text/plain',
      'text/csv',
      'text/html',
      'text/markdown',
      'text/xml',

      // 图片类型
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',

      // 其他常用类型
      'application/json',
      'application/xml',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream', // 通用二进制文件

      // 空MIME类型（某些文件可能没有MIME类型）
      '',
      'application/x-msdownload'
    ]

    // 获取文件扩展名
    const getFileExtension = (filename: string) => {
      return filename.toLowerCase().split('.').pop() || ''
    }

    const allowedExtensions = [
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
      'txt', 'csv', 'html', 'htm', 'md', 'xml',
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
      'json', 'zip', 'rar', '7z'
    ]

    const fileExtension = getFileExtension(file.name)

    // 检查MIME类型或文件扩展名
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      console.log('文件验证失败:', {
        fileName: file.name,
        fileType: file.type,
        fileExtension: fileExtension,
        allowedTypes: allowedTypes.slice(0, 5), // 只记录前几个避免日志过长
        allowedExtensions: allowedExtensions.slice(0, 10)
      })
      return NextResponse.json(
        { success: false, error: `不支持的文件类型。支持的格式：${allowedExtensions.join(', ')}` },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userId}/materials/${fileName}`

    // 上传到Supabase Storage
    console.log('开始上传文件到Storage:', filePath)
    const { error: uploadError } = await supabase.storage
      .from('product-materials')
      .upload(filePath, file)

    if (uploadError) {
      console.error('文件上传失败:', uploadError)
      return NextResponse.json(
        { success: false, error: `文件上传失败: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('文件上传到Storage成功')

    // 保存文件信息到数据库
    console.log('开始保存文件信息到数据库')
    const insertData = {
      user_id: userId,
      file_name: file.name,
      storage_path: filePath,
      file_type: file.type,
      file_size: file.size,
      description: description || null
    }
    console.log('插入数据:', insertData)

    const { data, error: dbError } = await supabase
      .from('product_materials')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('数据库保存失败:', dbError)
      // 删除已上传的文件
      await supabase.storage.from('product-materials').remove([filePath])
      return NextResponse.json(
        { success: false, error: `文件信息保存失败: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log('文件信息保存成功:', data)

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
