'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { IconX } from './Icons';
import { ANNOUNCEMENTS } from '@/lib/constants';

export default function AnnouncementBar({ messages = ANNOUNCEMENTS }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    try { if (sessionStorage.getItem('lift-announce-closed') === '1') setOpen(false); } catch {}
  }, []);

  useEffect(() => {
    if (!open || reduce) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => clearInterval(t);
  }, [open, messages.length, reduce]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem('lift-announce-closed', '1'); } catch {}
  };

  return (
    <div className="relative z-40 bg-graphite-900 text-white">
      <div className="container-x flex h-9 items-center justify-center gap-2 overflow-hidden text-[12px]">
        <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-accent sm:block" />
        <div className="relative h-9 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={index}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.35 }}
              className="absolute inset-0 flex items-center justify-center font-medium text-white/85"
            >
              {messages[index]}
            </motion.p>
          </AnimatePresence>
        </div>
        <button onClick={close} aria-label="بستن نوار اطلاعیه" className="shrink-0 rounded p-1 text-white/50 transition hover:text-white">
          <IconX width={13} height={13} />
        </button>
      </div>
    </div>
  );
}
