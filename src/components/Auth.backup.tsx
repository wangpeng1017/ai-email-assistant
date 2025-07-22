'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export default function AuthComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            AI邮件自动化助手
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请登录或注册以开始使用
          </p>
        </div>
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={`${window.location.origin}/dashboard`}
            localization={{
              variables: {
                sign_in: {
                  email_label: '邮箱地址',
                  password_label: '密码',
                  button_label: '登录',
                  loading_button_label: '登录中...',
                  social_provider_text: '使用 {{provider}} 登录',
                  link_text: '已有账户？点击登录',
                },
                sign_up: {
                  email_label: '邮箱地址',
                  password_label: '密码',
                  button_label: '注册',
                  loading_button_label: '注册中...',
                  social_provider_text: '使用 {{provider}} 注册',
                  link_text: '没有账户？点击注册',
                  confirmation_text: '请检查您的邮箱并点击确认链接',
                },
                forgotten_password: {
                  email_label: '邮箱地址',
                  button_label: '发送重置链接',
                  loading_button_label: '发送中...',
                  link_text: '忘记密码？',
                  confirmation_text: '请检查您的邮箱获取重置链接',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
