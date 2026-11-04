import HeroSlider from '@/components/HeroSlider';
import BrandMarquee from '@/components/BrandMarquee';
import TrustBar from '@/components/TrustBar';
import SizeFinder from '@/components/SizeFinder';
import CategoryCircles from '@/components/CategoryCircles';
import DealsSection from '@/components/DealsSection';
import CategoryBanners from '@/components/CategoryBanners';
import ProductTabs from '@/components/ProductTabs';
import OfferAndWhy from '@/components/OfferAndWhy';
import BlogCards from '@/components/BlogCards';
import SectionTitle from '@/components/SectionTitle';
import Reveal from '@/components/Reveal';
import { serverGet } from '@/lib/api';
import { demoHome } from '@/lib/demo';

export const revalidate = 0;

export const metadata = {
  title: 'خرید لاستیک اصل خودرو با ضمانت اصالت',
  description: 'لیفت تایر؛ فروشگاه تخصصی لاستیک خودرو با ضمانت اصالت و تاریخ تولید، ارسال به سراسر ایران با باربری و پست پیشتاز.',
};

export default async function HomePage() {
  const home = (await serverGet('/home', null)) || demoHome;
  const { banners, categories, brands, deals, bestsellers, newest, posts, settings } = home;
  const hero = banners?.hero?.length ? banners.hero : demoHome.banners.hero;
  const cats = categories?.length ? categories : demoHome.categories;
  const brandList = brands?.length ? brands : demoHome.brands;

  return (
    <>
      <HeroSlider slides={hero} />

      <BrandMarquee brands={brandList} thin />

      <section className="pt-6">
        <div className="container-x">
          <TrustBar />
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionTitle title="محبوب‌ترین برندهای لاستیک" subtitle="نمایندگی و عرضه‌کننده برندهای معتبر جهان و ایران" href="/products" linkLabel="همه محصولات" />
          <BrandMarquee brands={brandList} />
        </div>
      </section>

      <section className="pb-10">
        <div className="container-x grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <SizeFinder />
          <div className="relative overflow-hidden rounded-2xl border border-black/[.06] bg-graphite-900 p-5 text-white">
            <div className="tire-pattern absolute inset-0 opacity-40" />
            <img src="/images/products/tire-detail.png" alt="" className="absolute -left-6 -bottom-8 h-40 w-40 object-contain opacity-40" loading="lazy" />
            <div className="relative">
              <span className="text-[10px] font-bold tracking-widest text-accent">LIFT TIRE GUIDE</span>
              <h3 className="mt-2 text-lg font-extrabold leading-7">مطمئن نیستید چه سایزی نیاز دارید؟</h3>
              <p className="mt-1.5 max-w-[260px] text-[11.5px] leading-5 text-white/55">
                کارشناسان ما با توجه به مدل خودرو و سبک رانندگی شما بهترین گزینه را پیشنهاد می‌دهند.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:${String(settings?.phone || '').replace(/[^\d+]/g, '')}`} className="btn-accent !px-4 !py-2 text-[11px]">مشاوره تلفنی</a>
                <a href="/blog/how-to-read-tire-size" className="rounded-xl border border-white/20 px-4 py-2 text-[11px] font-bold text-white/80 transition hover:border-accent hover:text-accent">آموزش خواندن سایز</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="container-x">
          <SectionTitle title="محبوب‌ترین دسته‌ها" subtitle="دسته‌بندی محصولات بر اساس نوع خودرو و کاربری" />
          <CategoryCircles categories={cats} />
        </div>
      </section>

      <DealsSection products={deals?.length ? deals : demoHome.deals} />

      <CategoryBanners banners={banners?.category || []} />

      <ProductTabs bestsellers={bestsellers?.length ? bestsellers : demoHome.bestsellers} newest={newest?.length ? newest : demoHome.newest} />

      <OfferAndWhy settings={settings} />

      <div className="section">
        <Reveal>
          <BlogCards posts={posts?.length ? posts : demoHome.posts} />
        </Reveal>
      </div>
    </>
  );
}
