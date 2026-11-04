import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import MiniCart from '@/components/MiniCart';
import { serverGet } from '@/lib/api';
import { demoHome } from '@/lib/demo';

export default async function SiteLayout({ children }) {
  const home = (await serverGet('/home', null)) || demoHome;
  const settings = home?.settings || demoHome.settings;
  const categories = home?.categories || [];
  const brands = home?.brands || [];

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header settings={settings} brands={brands} categories={categories} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer settings={settings} categories={categories} />
      <MobileNav settings={settings} />
      <MiniCart />
    </div>
  );
}
