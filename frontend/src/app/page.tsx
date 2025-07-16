import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductGrid } from '@/components/features/ProductGrid'
import { CategorySlider } from '@/components/features/CategorySlider'
import { HeroBanner } from '@/components/features/HeroBanner'
import { PromotionBar } from '@/components/features/PromotionBar'

export const metadata: Metadata = {
  title: 'الصفحة الرئيسية',
  description: 'تسوق أفضل المنتجات في سوريا - توصيل سريع وآمن',
}

export default async function HomePage() {
  // In production, these would be fetched from API
  const featuredProducts = []
  const categories = []
  const promotions = []
  
  return (
    <main className="min-h-screen">
      {/* Promotion Bar */}
      <PromotionBar promotions={promotions} />
      
      {/* Hero Section */}
      <HeroBanner />
      
      {/* Categories Section */}
      <section className="py-8 bg-gray-50">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="h3">تسوق حسب الفئة</h2>
            <Link 
              href="/categories" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              عرض الكل
            </Link>
          </div>
          <CategorySlider categories={categories} />
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="h3">منتجات مميزة</h2>
            <Link 
              href="/products" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              عرض المزيد
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">ضمان الجودة</h3>
              <p className="text-gray-600 text-sm">جميع منتجاتنا أصلية 100% مع ضمان الجودة</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">أسعار منافسة</h3>
              <p className="text-gray-600 text-sm">نضمن لك أفضل الأسعار في السوق السورية</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">دعم 24/7</h3>
              <p className="text-gray-600 text-sm">فريق دعم متخصص لخدمتك على مدار الساعة</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="py-12 bg-primary-600 text-white">
        <div className="container text-center">
          <h2 className="h3 mb-4">اشترك في النشرة البريدية</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            احصل على أحدث العروض والمنتجات الجديدة مباشرة في بريدك الإلكتروني
          </p>
          <form className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="أدخل بريدك الإلكتروني"
              className="flex-1 px-4 py-2 rounded-md text-gray-900"
              dir="ltr"
            />
            <Button type="submit" variant="secondary">
              اشترك الآن
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}