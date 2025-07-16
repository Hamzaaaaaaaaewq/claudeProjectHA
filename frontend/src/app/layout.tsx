import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Noto_Sans_Arabic } from 'next/font/google'
import { headers } from 'next/headers'
import { Providers } from './providers'
import '@/styles/globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansArabic = Noto_Sans_Arabic({ 
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://syriamart.com'),
  title: {
    default: 'سوريا مارت | أكبر متجر إلكتروني في سوريا',
    template: '%s | سوريا مارت',
  },
  description: 'تسوق عبر الإنترنت في سوريا - ملابس، إلكترونيات، أجهزة منزلية وأكثر. توصيل سريع وآمن مع خيارات دفع متعددة.',
  keywords: ['تسوق', 'سوريا', 'متجر إلكتروني', 'توصيل', 'دمشق', 'حلب'],
  authors: [{ name: 'SyriaMart Team' }],
  creator: 'SyriaMart',
  publisher: 'SyriaMart',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'سوريا مارت',
    title: 'سوريا مارت | أكبر متجر إلكتروني في سوريا',
    description: 'تسوق عبر الإنترنت في سوريا - ملابس، إلكترونيات، أجهزة منزلية وأكثر.',
    locale: 'ar_SY',
    alternateLocale: 'en_US',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'سوريا مارت',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سوريا مارت | أكبر متجر إلكتروني في سوريا',
    description: 'تسوق عبر الإنترنت في سوريا - ملابس، إلكترونيات، أجهزة منزلية وأكثر.',
    images: ['/twitter-image.jpg'],
    creator: '@syriamart',
  },
  alternates: {
    canonical: '/',
    languages: {
      'ar': '/ar',
      'en': '/en',
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const locale = headersList.get('x-locale') || 'ar'
  const direction = locale === 'ar' ? 'rtl' : 'ltr'
  
  return (
    <html 
      lang={locale} 
      dir={direction}
      className={`${inter.variable} ${notoSansArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.syriamart.com" />
        <link rel="dns-prefetch" href="https://api.syriamart.com" />
      </head>
      <body 
        className={`
          min-h-screen bg-gray-50 text-gray-900 antialiased
          ${direction === 'rtl' ? 'font-arabic' : 'font-sans'}
        `}
      >
        <Providers locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  )
}