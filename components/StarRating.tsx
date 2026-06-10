type Props = {
  rating?: number | null;
  count?: number | null;
  size?: number;
  showNumber?: boolean;
};

function Stars({ size, className }: { size: number; className: string }) {
  return (
    <span className={`flex ${className}`} style={{ width: size * 5 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className="shrink-0">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5Z" />
        </svg>
      ))}
    </span>
  );
}

// Calificación con 5 estrellas y relleno parcial proporcional.
export default function StarRating({ rating, count, size = 16, showNumber = true }: Props) {
  if (rating == null) {
    return <span className="text-body-sm text-on-surface-variant/60">Sin calificación</span>;
  }
  const pct = Math.max(0, Math.min(1, rating / 5)) * 100;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-block" style={{ width: size * 5, height: size }}>
        <Stars size={size} className="absolute inset-0 text-outline-variant" />
        <span className="absolute left-0 top-0 h-full overflow-hidden" style={{ width: `${pct}%` }}>
          <Stars size={size} className="text-warning" />
        </span>
      </span>
      {showNumber && (
        <span className="text-body-sm tabular-nums text-on-surface-variant">
          {rating.toFixed(1)}
          {count != null && count > 0 && <span className="text-on-surface-variant/60"> ({count})</span>}
        </span>
      )}
    </span>
  );
}
