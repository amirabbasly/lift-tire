'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { IconArrowLeft } from './Icons';

export default function ProductTabs({ bestsellers = [], newest = [] }) {
  const [tab, setTab] = useState('best');
  const reduce = useReducedMotion();
  // انیمیشن فقط بعد از hydration — SSR نباید مخفی رندر شود
  const [animate, setAnimate] = useState(false);
  useEffect(() => setAnimate(true), []);
  const tabs = [
    { id: 'best', label: 'پرفروش‌ترین‌ها', items: bestsellers },
    { id: 'new', label: 'جدیدترین‌ها', items: newest },
  ];
  const active = tabs.find((t) => t.id === tab) || tabs[0];

  return (
    <section className="section">
      <div className="container-x">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-6 w-1.5 rounded-full bg-accent" />
              <h2 className="text-xl font-extrabold text-graphite-900 md:text-2xl">انتخاب مشتریان لیفت تایر</h2>
            </div>
            <p className="text-sm text-muted">بر اساس فروش و بازخورد واقعی مشتریان</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white p-1 shadow-card">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative rounded-lg px-4 py-2 text-[12.5px] font-bold transition ${tab === t.id ? 'text-white' : 'text-steel-500 hover:text-graphite-900'}`}
              >
                {tab === t.id && (
                  <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-lg bg-graphite-900" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={animate ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? {} : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {active.items.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 text-center">
          <Link href="/products" className="btn-ghost !px-6">
            مشاهده همه محصولات <IconArrowLeft width={16} height={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
