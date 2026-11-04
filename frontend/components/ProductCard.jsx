'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useCart, useToast } from './Providers';
import Stars from './Stars';
import { assetUrl, discountPercent, faNum, toman } from '@/lib/format';
import { IconCart, IconHeart } from './Icons';

export default function ProductCard({ product, layout = 'grid', showCountdown = false, index = 0 }) {
  const { add } = useCart();
  const { show } = useToast();
  const reduce = useReducedMotion();
  const off = product.discount || discountPercent(product.price, product.old_price);
  const image = product.image || product.images?.[0]?.url;
  const out = Number(product.stock) <= 0;

  const quickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    add(product, 1);
    show(`«${product.name}» به سبد خرید اضافه شد.`);
  };

  const wrap = layout === 'list';

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.24) }}
      className={`group relative overflow-hidden rounded-2xl border border-black/[.06] bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-card ${
        wrap ? 'flex gap-4 p-3' : 'flex flex-col'
      }`}
    >
      <Link href={`/products/${product.slug}`} className={`relative block ${wrap ? 'w-[132px] shrink-0' : ''}`} aria-label={product.name}>
        <div className={`relative overflow-hidden rounded-xl bg-white ${wrap ? 'aspect-square' : 'aspect-[4/3.4] p-3'}`}>
          <img
            src={assetUrl(image)}
            alt={product.name}
            className={`h-full w-full object-contain transition-transform duration-500 ${out ? 'opacity-45 grayscale' : 'group-hover:scale-[1.06]'}`}
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
          />
          {off > 0 && !out && (
            <span className="num absolute right-2 top-2 rounded-lg bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {faNum(off)}٪
            </span>
          )}
          {out && (
            <span className="absolute inset-x-2 bottom-2 rounded-lg bg-graphite-900/85 py-1 text-center text-[11px] font-bold text-white">
              ناموجود
            </span>
          )}
          {product.badge && !out && (
            <span className="absolute left-2 top-2 rounded-lg bg-graphite-900/85 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      <div className={`flex flex-1 flex-col ${wrap ? 'py-1 pl-1' : 'p-3 pt-2.5'}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10.5px] font-bold text-accent-dark">{product.brand?.name_fa || product.brand_name}</span>
          <Stars rating={product.rating} size={11} />
        </div>
        <Link href={`/products/${product.slug}`} className="mt-1 line-clamp-2 min-h-[34px] text-[12.5px] font-bold leading-[1.45] text-graphite-900 transition group-hover:text-accent-dark">
          {product.name}
        </Link>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="num rounded-md bg-graphite-900 px-1.5 py-0.5 text-[12px] font-bold text-white" dir="ltr">
            {product.size}
          </span>
          {product.season && <span className="text-[10px] text-muted">{product.season}</span>}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="min-w-0">
            {product.old_price ? (
              <span className="num block text-[10.5px] text-muted line-through" dir="ltr">{faNum(Number(product.old_price).toLocaleString('en-US'))}</span>
            ) : (
              <span className="block h-[14px]" />
            )}
            <span className="num text-[14px] font-extrabold text-graphite-900">
              {toman(product.price)}
            </span>
          </div>
          <button
            onClick={quickAdd}
            disabled={out}
            aria-label={`افزودن ${product.name} به سبد`}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${
              out
                ? 'cursor-not-allowed border-black/10 text-muted/40'
                : 'border-accent/30 bg-accent-soft text-accent-dark hover:bg-accent hover:text-white hover:shadow-glow'
            }`}
          >
            <IconCart width={17} height={17} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
