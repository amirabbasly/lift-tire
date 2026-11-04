'use client';

import { useEffect, useState } from 'react';
import { faNum } from '@/lib/format';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Countdown({ className = '', label = 'تا پایان پیشنهاد' }) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const tick = () => {
      const diff = Math.max(0, end.getTime() - Date.now());
      setLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  if (!left) return <span className={`num ${className}`}>--:--:--</span>;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="hidden text-[11px] text-muted sm:inline">{label}</span>
      <span className="num inline-flex items-center gap-0.5 rounded-lg bg-graphite-900 px-2 py-1 text-[12px] font-bold text-white" dir="ltr">
        {faNum(pad(left.h))}:{faNum(pad(left.m))}:{faNum(pad(left.s))}
      </span>
    </span>
  );
}
