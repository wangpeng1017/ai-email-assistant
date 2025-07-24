'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

// 图标组件
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
  </svg>
)

const LeadAcquisitionIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"></path>
  </svg>
)

const LeadsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
  </svg>
)

const MaterialsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
)

const TemplatesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
  </svg>
)



const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
)

const CollapseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
  </svg>
)

const ExpandIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
  </svg>
)

// 导航项类型
type NavItem = {
  name: string
  path: string
  icon: React.ReactNode
  badge?: number
  comingSoon?: boolean
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  
  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  // 导航项
  const navItems: NavItem[] = [
    { name: '仪表板', path: '/dashboard', icon: <DashboardIcon /> },
    { name: '线索获取', path: '/dashboard?tab=lead-acquisition', icon: <LeadAcquisitionIcon /> },
    { name: '线索管理', path: '/dashboard?tab=leads', icon: <LeadsIcon />, badge: 5 },
    { name: '产品资料', path: '/dashboard?tab=materials', icon: <MaterialsIcon /> },
    { name: '邮件模板', path: '/dashboard?tab=templates', icon: <TemplatesIcon />, comingSoon: true },
    { name: '设置', path: '/dashboard?tab=settings', icon: <SettingsIcon /> },
  ]
  
  // 移动端侧边栏控制
  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }
  
  // 侧边栏样式
  const sidebarClasses = `
    fixed left-0 top-0 h-full bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 z-40
    ${collapsed ? 'w-16' : 'w-64'} 
    ${isMobile && collapsed ? '-translate-x-full' : 'translate-x-0'}
  `
  
  // 移动端遮罩
  const overlayClasses = `
    fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300
    ${isMobile && !collapsed ? 'opacity-100 visible' : 'opacity-0 invisible'}
  `
  
  return (
    <>
      {/* 移动端菜单按钮 */}
      {isMobile && (
        <button 
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white shadow-lg"
          onClick={toggleSidebar}
        >
          {collapsed ? <ExpandIcon /> : <CollapseIcon />}
        </button>
      )}
      
      {/* 遮罩层 */}
      <div className={overlayClasses} onClick={() => setCollapsed(true)} />
      
      {/* 侧边栏 */}
      <div className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* 顶部Logo */}
          <div className={`flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 ${collapsed ? 'px-2' : 'px-4'}`}>
            {collapsed ? (
              <span className="text-2xl font-bold text-blue-600">AI</span>
            ) : (
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">AI邮件助手</h1>
            )}
          </div>
          
          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path || 
                  (pathname.includes('/dashboard') && item.path.includes(pathname.split('?')[0]));
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.comingSoon ? '#' : item.path}
                      className={`
                        flex items-center p-2 rounded-lg transition-colors duration-200
                        ${isActive 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
                        ${item.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={e => {
                        if (item.comingSoon) {
                          e.preventDefault()
                        } else if (isMobile) {
                          setCollapsed(true)
                        }
                      }}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      
                      {!collapsed && (
                        <>
                          <span className="ml-3 flex-1">{item.name}</span>
                          
                          {item.badge && (
                            <span className="inline-flex items-center justify-center w-5 h-5 ml-2 text-xs font-semibold text-white bg-blue-600 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          
                          {item.comingSoon && (
                            <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                              即将推出
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          
          {/* 底部用户信息 */}
          {user && (
            <div className={`
              border-t border-gray-200 dark:border-gray-700 p-4
              ${collapsed ? 'flex justify-center' : ''}
            `}>
              {collapsed ? (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      已登录
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 折叠按钮 (仅桌面端显示) */}
          {!isMobile && (
            <button
              className="flex items-center justify-center p-4 border-t border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ExpandIcon /> : <CollapseIcon />}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
