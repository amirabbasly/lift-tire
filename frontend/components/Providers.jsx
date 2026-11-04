'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';

/* ---------------------------------- toast --------------------------------- */
const ToastCtx = createContext({ show: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const show = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-8" dir="rtl">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lift ${
              t.type === 'error' ? 'bg-danger' : t.type === 'info' ? 'bg-graphite-800' : 'bg-success'
            }`}
            style={{ animation: 'toastIn .25s ease-out' }}
          >
            <span className="text-base">{t.type === 'error' ? '!' : '✓'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
      `}</style>
    </ToastCtx.Provider>
  );
}

/* ----------------------------------- auth --------------------------------- */
const AuthCtx = createContext(null);
export function useAuth() {
  return useContext(AuthCtx);
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('lift-token');
      const c = localStorage.getItem('lift-customer');
      if (t) setToken(t);
      if (c) setCustomer(JSON.parse(c));
    } catch {}
    setReady(true);
  }, []);

  const persist = useCallback((t, c) => {
    setToken(t);
    setCustomer(c);
    try {
      if (t) localStorage.setItem('lift-token', t);
      else localStorage.removeItem('lift-token');
      if (c) localStorage.setItem('lift-customer', JSON.stringify(c));
      else localStorage.removeItem('lift-customer');
    } catch {}
  }, []);

  const login = useCallback(
    async (phone, password) => {
      const data = await api('/customer/login', { method: 'POST', body: { phone, password } });
      persist(data.token, data.customer);
      return data.customer;
    },
    [persist],
  );

  const register = useCallback(
    async (payload) => {
      const data = await api('/customer/register', { method: 'POST', body: payload });
      persist(data.token, data.customer);
      return data.customer;
    },
    [persist],
  );

  const logout = useCallback(() => persist(null, null), [persist]);
  const updateCustomer = useCallback((c) => persist(token, c), [persist, token]);

  const value = useMemo(
    () => ({ token, customer, ready, login, register, logout, updateCustomer }),
    [token, customer, ready, login, register, logout, updateCustomer],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/* ----------------------------------- cart --------------------------------- */
const CartCtx = createContext(null);
export function useCart() {
  return useContext(CartCtx);
}

const CART_KEY = 'lift-cart';

function CartProvider({ children }) {
  const { token, ready: authReady } = useAuth();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const syncedFor = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw) || []);
    } catch {}
    setReady(true);
  }, []);

  // ذخیره محلی
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  // سینک با سرور بعد از ورود
  useEffect(() => {
    if (!authReady || !token || syncedFor.current === token) return;
    syncedFor.current = token;
    let cancelled = false;
    (async () => {
      try {
        const serverItems = await api('/customer/cart', { token });
        if (cancelled) return;
        if (Array.isArray(serverItems) && serverItems.length) {
          setItems((local) => {
            const map = new Map();
            for (const it of [...serverItems, ...local]) {
              const prev = map.get(it.id);
              if (!prev) map.set(it.id, { ...it });
              else map.set(it.id, { ...prev, qty: Math.min(prev.stock || 20, prev.qty + it.qty) });
            }
            return [...map.values()];
          });
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [token, authReady]);

  // سینک دوره‌ای
  useEffect(() => {
    if (!ready || !token) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api('/customer/cart', { method: 'PUT', token, body: { items } }).catch(() => {});
    }, 900);
    return () => clearTimeout(saveTimer.current);
  }, [items, token, ready]);

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      const max = product.stock ?? 20;
      if (existing) {
        return prev.map((p) => (p.id === product.id ? { ...p, qty: Math.min(max, Math.max(1, p.qty + qty)) } : p));
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          size: product.size,
          price: product.price,
          old_price: product.old_price || null,
          image: product.image || product.images?.[0]?.url || '',
          brand: product.brand?.name_fa || product.brand_name || '',
          stock: product.stock ?? 20,
          qty: Math.min(max, Math.max(1, qty)),
        },
      ];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, Math.min(p.stock || 20, Number(qty) || 1)) } : p)),
    );
  }, []);
  const clear = useCallback(() => setItems([]), []);
  const count = items.reduce((s, p) => s + p.qty, 0);
  const subtotal = items.reduce((s, p) => s + p.price * p.qty, 0);

  const value = useMemo(
    () => ({ items, add, remove, setQty, clear, count, subtotal, open, setOpen, ready }),
    [items, add, remove, setQty, clear, count, subtotal, open, ready],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function Providers({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
