/** @type {import('next').NextConfig} */

const { withSentryConfig } = require('@sentry/nextjs');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Internationalization
  i18n: {
    locales: ['ar', 'en'],
    defaultLocale: 'ar',
    localeDetection: false,
  },
  
  // Image optimization
  images: {
    domains: [
      'cdn.syriamart.com',
      'images.syriamart.com',
      'localhost',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 640, 768, 1024, 1280, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/vendor/dashboard',
        permanent: false,
      },
    ];
  },
  
  // Rewrites for API proxying in development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/v1/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname + '/src',
    };
    
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Ignore specific modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Environment variables exposed to browser
  publicRuntimeConfig: {
    version: process.env.npm_package_version,
  },
  
  // Server runtime configuration
  serverRuntimeConfig: {
    apiUrl: process.env.API_URL,
  },
  
  // PWA configuration
  experimental: {
    appDir: true,
    serverActions: true,
  },
  
  // Output configuration
  output: 'standalone',
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Trailing slash
  trailingSlash: false,
  
  // Powered by header
  poweredByHeader: false,
};

// Sentry configuration for error tracking
const sentryWebpackPluginOptions = {
  org: 'syriamart',
  project: 'frontend',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

// Export with bundle analyzer and Sentry
module.exports = process.env.NODE_ENV === 'production'
  ? withSentryConfig(
      withBundleAnalyzer(nextConfig),
      sentryWebpackPluginOptions
    )
  : withBundleAnalyzer(nextConfig);