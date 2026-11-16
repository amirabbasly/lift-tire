import HeroSlider from '@/components/HeroSlider';
import BrandMarquee from '@/components/BrandMarquee';
import TrustBar from '@/components/TrustBar';
import SizeFinder from '@/components/SizeFinder';
import SizeGuideCard from '@/components/SizeGuideCard';
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
import { getMagazinePosts } from '@/lib/magazine';

export const revalidate = 0;

export const metadata = {
  title: 'خرید و بررسی لاستیک خودرو',
  description: 'در لیفت تایر مشخصات و سایز لاستیک‌ها را بررسی کنید و راهنماهای انتخاب و نگهداری تایر را بخوانید.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const home = (await serverGet('/home', null)) || demoHome;
  const { banners, categories, brands, deals, bestsellers, newest, settings } = home;
  // فهرست ثابت قبلی صفحه اصلی حفظ می‌شود؛ مطالب تازه فقط در مجله اضافه می‌شوند.
  const magazinePosts = await getMagazinePosts('homepage');
  const featuredArticle = magazinePosts.find((post) => post.slug === 'khodro-chare-national-automotive-services');
  const homePosts = featuredArticle ? [featuredArticle, ...magazinePosts.filter((post) => post.slug !== featuredArticle.slug)] : magazinePosts;
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
          <SizeGuideCard settings={settings} />
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
          <BlogCards posts={homePosts} />
        </Reveal>
      </div>
    </>
  );
}
