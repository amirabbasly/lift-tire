import CartClient from '@/components/CartClient';

export const metadata = { title: 'سبد خرید', robots: { index: false, follow: true } };

export default function CartPage() {
  return <CartClient />;
}
