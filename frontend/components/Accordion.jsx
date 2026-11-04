'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Accordion({ items = [] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={it.q} className="overflow-hidden rounded-2xl border border-black/[.06] bg-white">
          <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-right">
            <span className="text-[12.5px] font-extrabold text-graphite-900">{it.q}</span>
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[15px] font-bold transition ${open === i ? 'bg-accent text-white' : 'bg-surface text-steel-500'}`}>
              {open === i ? '−' : '+'}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                <p className="px-4 pb-4 text-[12px] leading-7 text-steel-500">{it.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
