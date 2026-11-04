import { IconStar } from './Icons';
import { faNum } from '@/lib/format';

export default function Stars({ rating = 0, count = 0, size = 13, showValue = false, className = '' }) {
  const full = Math.round(Number(rating) || 0);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="flex items-center gap-0.5 text-warning">
        {Array.from({ length: 5 }).map((_, i) => (
          <IconStar key={i} filled={i < full} width={size} height={size} className={i < full ? 'opacity-100' : 'opacity-30'} />
        ))}
      </span>
      {showValue && <span className="num text-[11px] font-semibold text-muted">{faNum((Number(rating) || 0).toFixed(1))}</span>}
      {count > 0 && <span className="text-[11px] text-muted">({faNum(count)})</span>}
    </span>
  );
}
