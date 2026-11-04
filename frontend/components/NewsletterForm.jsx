'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from './Providers';

export default function NewsletterForm({ dark = true }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api('/newsletter', { method: 'POST', body: { email } });
      show(res.message || 'عضویت شما ثبت شد.', 'success');
      setEmail('');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="ایمیل شما"
        className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
          dark ? 'border-white/15 bg-white/5 text-white placeholder:text-white/35 focus:border-accent' : 'border-black/10 bg-white text-ink focus:border-accent'
        }`}
        dir="ltr"
      />
      <button type="submit" disabled={loading} className="btn-accent shrink-0 !px-4 !py-2.5 text-xs">
        {loading ? '…' : 'عضویت'}
      </button>
    </form>
  );
}
