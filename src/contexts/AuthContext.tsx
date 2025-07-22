'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    // 获取正确的重定向URL
    const getRedirectUrl = () => {
      // 优先使用环境变量中的站点URL
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

      if (siteUrl) {
        console.log('🌐 使用环境变量站点URL:', siteUrl);
        return `${siteUrl}/dashboard`;
      }

      // 如果没有环境变量，使用当前域名
      if (typeof window !== 'undefined') {
        const currentOrigin = window.location.origin;

        // 如果是localhost，强制使用生产URL
        if (currentOrigin.includes('localhost')) {
          const productionUrl = 'https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app';
          console.log('🔄 从localhost重定向到生产环境:', productionUrl);
          return `${productionUrl}/dashboard`;
        }

        // 使用当前域名
        console.log('📍 使用当前域名:', currentOrigin);
        return `${currentOrigin}/dashboard`;
      }

      // 服务器端渲染时的默认值
      const fallbackUrl = 'https://ai-email-assistant-f-git-bf6853-wangpeng10170414-1653s-projects.vercel.app';
      console.log('🔧 使用默认生产URL:', fallbackUrl);
      return `${fallbackUrl}/dashboard`;
    };

    const redirectUrl = getRedirectUrl();
    console.log('✅ 最终OAuth重定向URL:', redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })
    if (error) {
      console.error('❌ Google OAuth错误:', error);
      throw error;
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    signInWithGoogle,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
