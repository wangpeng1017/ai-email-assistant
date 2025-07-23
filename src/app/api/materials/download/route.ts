import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!materialId || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证用户权限并获取文件信息
    const { data: material, error: dbError } = await supabase
      .from('product_materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', userId)
      .single()

    if (dbError || !material) {
      return NextResponse.json(
        { success: false, error: '文件不存在或无权限访问' },
        { status: 404 }
      )
    }

    // 从Storage下载文件
    const { data: fileData, error: storageError } = await supabase.storage
      .from('product-materials')
      .download(material.storage_path)

    if (storageError || !fileData) {
      console.error('Storage下载错误:', storageError)
      return NextResponse.json(
        { success: false, error: '文件下载失败' },
        { status: 500 }
      )
    }

    // 将Blob转换为ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer()

    // 返回文件数据
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': material.file_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(material.file_name)}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('下载API错误:', error)
    return NextResponse.json(
      { success: false, error: '下载过程中出现错误' },
      { status: 500 }
    )
  }
}

// 获取文件的公共URL（用于预览）
export async function POST(request: NextRequest) {
  try {
    const { materialId, userId } = await request.json()

    if (!materialId || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证用户权限并获取文件信息
    const { data: material, error: dbError } = await supabase
      .from('product_materials')
      .select('*')
      .eq('id', materialId)
      .eq('user_id', userId)
      .single()

    if (dbError || !material) {
      return NextResponse.json(
        { success: false, error: '文件不存在或无权限访问' },
        { status: 404 }
      )
    }

    // 生成签名URL（有效期1小时）
    const { data: urlData, error: urlError } = await supabase.storage
      .from('product-materials')
      .createSignedUrl(material.storage_path, 3600)

    if (urlError || !urlData) {
      console.error('URL生成错误:', urlError)
      return NextResponse.json(
        { success: false, error: 'URL生成失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: urlData.signedUrl,
      material: material
    })

  } catch (error) {
    console.error('URL生成API错误:', error)
    return NextResponse.json(
      { success: false, error: 'URL生成过程中出现错误' },
      { status: 500 }
    )
  }
}
