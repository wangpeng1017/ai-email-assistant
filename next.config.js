/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量验证
  env: {
    // 确保环境变量在构建时可用
    CUSTOM_BUILD_TIME: new Date().toISOString(),
  },
  
  // 实验性功能
  experimental: {
    // 启用服务器组件
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // 构建优化
  compiler: {
    // 移除console.log在生产环境
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/',
        permanent: false,
      },
    ]
  },
  
  // 环境变量验证中间件
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Webpack配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 环境变量验证
    if (!dev) {
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'GEMINI_API_KEY'
      ];
      
      const missingVars = requiredEnvVars.filter(varName => {
        const value = process.env[varName];
        return !value || value.trim() === '' || value.includes('placeholder');
      });
      
      if (missingVars.length > 0) {
        console.error('❌ 缺少必要的环境变量:');
        missingVars.forEach(varName => {
          console.error(`   - ${varName}: ${process.env[varName] || '未设置'}`);
        });
        throw new Error(`构建失败: 缺少必要的环境变量 [${missingVars.join(', ')}]`);
      }
      
      // 验证Supabase URL格式
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const cleanedUrl = supabaseUrl.trim().replace(/\/+$/, '');
        try {
          new URL(cleanedUrl);
          console.log('✅ Supabase URL验证通过:', cleanedUrl);
        } catch (error) {
          console.error('❌ Supabase URL格式无效:', supabaseUrl);
          throw new Error(`构建失败: NEXT_PUBLIC_SUPABASE_URL格式无效 - "${supabaseUrl}"`);
        }
      }
    }
    
    return config;
  },
  
  // 输出配置
  output: 'standalone',
  
  // 图片优化
  images: {
    domains: ['ulrvltozsppbskksycmg.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 性能优化
  poweredByHeader: false,
  compress: true,
  
  // TypeScript配置
  typescript: {
    // 在生产构建时忽略类型错误（可选）
    ignoreBuildErrors: false,
  },
  
  // ESLint配置
  eslint: {
    // 在生产构建时忽略ESLint错误（可选）
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
