import { redirect } from 'next/navigation';

export const metadata = { title: 'علاقه‌مندی‌ها', robots: { index: false, follow: true } };

export default function WishlistPage() {
  redirect('/account?tab=wishlist');
}
