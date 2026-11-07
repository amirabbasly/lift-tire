export const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
  </svg>
);
export const IconCart = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20.5 7H6" />
    <circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17.5" cy="19.5" r="1.3" />
  </svg>
);
export const IconUser = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...p}>
    <circle cx="12" cy="8.5" r="3.7" /><path d="M4.8 20a7.5 7.5 0 0 1 14.4 0" />
  </svg>
);
export const IconMenu = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconX = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconPhone = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4.5 5.5c0-.8.7-1.5 1.5-1.5h2c.7 0 1.3.5 1.5 1.2l.6 2.6c.1.6-.2 1.2-.7 1.5l-1.3.8a12 12 0 0 0 5.3 5.3l.8-1.3c.3-.5.9-.8 1.5-.7l2.6.6c.7.2 1.2.8 1.2 1.5v2c0 .8-.7 1.5-1.5 1.5A15.5 15.5 0 0 1 4.5 5.5Z" />
  </svg>
);
export const IconChevron = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m14 6-6 6 6 6" />
  </svg>
);
export const IconArrowLeft = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 12H5m6-6-6 6 6 6" />
  </svg>
);
export const IconStar = ({ filled = true, ...p }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" strokeLinejoin="round" />
  </svg>
);
export const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);
export const IconFilter = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);
export const IconTrash = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
);
export const IconTruck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2 16V7h11v9M13 10h4l3 3v3h-7" /><circle cx="6.5" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" />
  </svg>
);
export const IconShield = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
export const IconGrid = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>
);
export const IconList = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M4 5h16v3H4zM4 10.5h16v3H4zM4 16h16v3H4z" /></svg>
);
export const IconHeart = ({ filled = false, ...p }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...p}>
    <path d="M12 20s-7-4.3-7-9a3.9 3.9 0 0 1 7-2.4A3.9 3.9 0 0 1 19 11c0 4.7-7 9-7 9Z" />
  </svg>
);
export const IconRuler = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3.2 9.2 9.2 3.2a1.6 1.6 0 0 1 2.3 0l9.3 9.3a1.6 1.6 0 0 1 0 2.3l-6 6a1.6 1.6 0 0 1-2.3 0L3.2 11.5a1.6 1.6 0 0 1 0-2.3Z" />
    <path d="M7.6 7.6l2 2M10.8 4.4l2 2M5 10.2l2 2M12.8 8.4l2 2M15.6 5.6l2 2" />
  </svg>
);
export const IconMail = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2.6" />
    <path d="m3.6 7.4 7.5 5.3a1.6 1.6 0 0 0 1.8 0l7.5-5.3" />
  </svg>
);
export const IconLock = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="4.6" y="10.4" width="14.8" height="10" rx="2.6" />
    <path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" />
    <path d="M12 14.4v2.4" />
  </svg>
);
export const IconEye = ({ off = false, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3.1" />
    {off && <path d="M4 20 20 4" />}
  </svg>
);

