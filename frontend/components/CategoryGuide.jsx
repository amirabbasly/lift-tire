import Link from 'next/link';

export default function CategoryGuide({ guide }) {
  if (!guide) return null;
  return (
    <section aria-labelledby="category-guide-title" className="mt-8 rounded-2xl border border-black/[.06] bg-white p-5 md:p-6">
      <h2 id="category-guide-title" className="text-[15px] font-extrabold text-graphite-900">{guide.heading}</h2>
      {guide.paragraphs.map((paragraph) => <p key={paragraph} className="mt-2 text-[12.5px] leading-7 text-steel-500">{paragraph}</p>)}
      <nav aria-label="راهنماهای مرتبط" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-bold text-accent-dark">
        {guide.links.map((link) => <Link key={link.href} href={link.href} className="hover:underline">{link.label} ←</Link>)}
      </nav>
    </section>
  );
}
