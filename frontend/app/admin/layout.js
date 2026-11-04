export const metadata = { title: 'پنل مدیریت لیفت تایر', robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }) {
  return <div className="min-h-screen bg-surface">{children}</div>;
}
