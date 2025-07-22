'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { useNotification } from './Notification'

interface LeadData {
  customer_name: string
  customer_email: string
  customer_website: string
}

interface ExcelUploadFormProps {
  onDataParsed: (leads: LeadData[]) => void
  onUploadStart: () => void
  onUploadComplete: () => void
}

export default function ExcelUploadForm({ 
  onDataParsed, 
  onUploadStart, 
  onUploadComplete 
}: ExcelUploadFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedData, setParsedData] = useState<LeadData[]>([])
  const [fileName, setFileName] = useState<string>('')
  const { showNotification } = useNotification()

  // 验证Excel数据格式
  const validateLeadData = (data: any[]): LeadData[] => {
    const validLeads: LeadData[] = []
    const errors: string[] = []

    data.forEach((row, index) => {
      const rowNum = index + 2 // Excel行号从2开始（第1行是标题）
      
      // 检查必需字段
      if (!row.customer_name && !row['客户名称'] && !row['公司名称']) {
        errors.push(`第${rowNum}行：缺少客户名称`)
        return
      }
      
      if (!row.customer_email && !row['邮箱'] && !row['电子邮箱']) {
        errors.push(`第${rowNum}行：缺少邮箱地址`)
        return
      }
      
      if (!row.customer_website && !row['网站'] && !row['官网']) {
        errors.push(`第${rowNum}行：缺少网站地址`)
        return
      }

      // 邮箱格式验证
      const email = row.customer_email || row['邮箱'] || row['电子邮箱']
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push(`第${rowNum}行：邮箱格式不正确`)
        return
      }

      // 网站URL格式验证
      const website = row.customer_website || row['网站'] || row['官网']
      let formattedWebsite = website.trim()
      if (!formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
        formattedWebsite = 'https://' + formattedWebsite
      }

      try {
        new URL(formattedWebsite)
      } catch {
        errors.push(`第${rowNum}行：网站地址格式不正确`)
        return
      }

      // 添加有效数据
      validLeads.push({
        customer_name: (row.customer_name || row['客户名称'] || row['公司名称']).trim(),
        customer_email: email.trim().toLowerCase(),
        customer_website: formattedWebsite
      })
    })

    if (errors.length > 0) {
      showNotification(`数据验证发现 ${errors.length} 个错误：\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`, 'error')
    }

    return validLeads
  }

  // 解析Excel文件
  const parseExcelFile = useCallback((file: File) => {
    setIsProcessing(true)
    onUploadStart()

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 获取第一个工作表
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // 转换为JSON数据
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        })

        if (jsonData.length < 2) {
          throw new Error('Excel文件至少需要包含标题行和一行数据')
        }

        // 获取标题行和数据行
        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1) as any[][]

        // 转换为对象数组
        const objectData = rows.map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        }).filter(row => {
          // 过滤空行
          return Object.values(row).some(value => value && value.toString().trim())
        })

        console.log('解析的Excel数据:', objectData)

        // 验证数据
        const validLeads = validateLeadData(objectData)
        
        if (validLeads.length === 0) {
          throw new Error('没有找到有效的客户数据，请检查Excel格式')
        }

        setParsedData(validLeads)
        setFileName(file.name)
        onDataParsed(validLeads)
        
        showNotification(
          `成功解析 ${validLeads.length} 条客户数据${objectData.length > validLeads.length ? `（跳过 ${objectData.length - validLeads.length} 条无效数据）` : ''}`, 
          'success'
        )

      } catch (error) {
        console.error('Excel解析错误:', error)
        showNotification(
          `Excel文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`, 
          'error'
        )
      } finally {
        setIsProcessing(false)
        onUploadComplete()
      }
    }

    reader.onerror = () => {
      setIsProcessing(false)
      onUploadComplete()
      showNotification('文件读取失败，请重试', 'error')
    }

    reader.readAsArrayBuffer(file)
  }, [onDataParsed, onUploadStart, onUploadComplete, showNotification])

  // 文件拖拽处理
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // 检查文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showNotification('请上传Excel文件（.xlsx, .xls）或CSV文件', 'error')
      return
    }

    // 检查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      showNotification('文件大小不能超过10MB', 'error')
      return
    }

    parseExcelFile(file)
  }, [parseExcelFile, showNotification])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: isProcessing
  })

  return (
    <div className="space-y-6">
      {/* 文件上传区域 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isProcessing ? '正在处理文件...' : '拖拽Excel文件到此处'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              或点击选择文件（支持 .xlsx, .xls, .csv 格式，最大10MB）
            </p>
          </div>
          
          {isProcessing && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Excel格式说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Excel文件格式要求</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>必需列：</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code>customer_name</code> 或 <code>客户名称</code> 或 <code>公司名称</code></li>
            <li><code>customer_email</code> 或 <code>邮箱</code> 或 <code>电子邮箱</code></li>
            <li><code>customer_website</code> 或 <code>网站</code> 或 <code>官网</code></li>
          </ul>
          <p className="mt-2"><strong>示例：</strong></p>
          <div className="bg-white border rounded p-2 mt-1 font-mono text-xs">
            客户名称 | 邮箱 | 网站<br/>
            张三科技 | contact@zhangsan.com | www.zhangsan.com
          </div>
        </div>
      </div>

      {/* 解析结果预览 */}
      {parsedData.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">
            ✅ 成功解析 {parsedData.length} 条客户数据
          </h4>
          <p className="text-sm text-green-800 mb-3">
            文件：{fileName}
          </p>
          
          {/* 数据预览 */}
          <div className="max-h-40 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-green-100">
                  <th className="px-2 py-1 text-left">客户名称</th>
                  <th className="px-2 py-1 text-left">邮箱</th>
                  <th className="px-2 py-1 text-left">网站</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((lead, index) => (
                  <tr key={index} className="border-t border-green-200">
                    <td className="px-2 py-1">{lead.customer_name}</td>
                    <td className="px-2 py-1">{lead.customer_email}</td>
                    <td className="px-2 py-1">{lead.customer_website}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 5 && (
              <p className="text-xs text-green-600 mt-2 text-center">
                ... 还有 {parsedData.length - 5} 条数据
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
