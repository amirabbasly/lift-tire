import { redirect } from 'next/navigation';

export const metadata = { title: 'علاقه‌مندی‌ها' };

export default function WishlistPage() {
  redirect('/account?tab=wishlist');
}
