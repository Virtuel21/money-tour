export type InsuranceStyle = 'shield' | 'outline' | 'medallion';

/** Vector artwork shares the case's projection and never captures clicks. */
export function InsuranceBadge({
  matrix,
  color,
  variant = 'shield',
  tile,
}: {
  matrix: number[];
  color: string;
  variant?: InsuranceStyle;
  tile: number;
}) {
  return (
    <svg
      data-insurance-tile={tile}
      className="tile-face-label insurance-badge"
      viewBox="40 0 160 180"
      aria-hidden="true"
      style={{ height: 180, transform: `matrix(${matrix.join(',')})` }}
    >
      {variant === 'medallion' && (
        <circle cx="120" cy="89" r="78" fill="#fff7df" stroke={color} strokeWidth="12" />
      )}
      <path
        d="M120 15 186 39V86C186 123 160 149 120 168 80 149 54 123 54 86V39Z"
        fill={variant === 'outline' ? '#fff7df' : color}
        stroke="#102f3c"
        strokeWidth="13"
        strokeLinejoin="round"
      />
      <path
        d="M120 15 186 39V86C186 123 160 149 120 168 80 149 54 123 54 86V39Z"
        fill="none"
        stroke="#fff7df"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="m88 87 23 25 42-47"
        fill="none"
        stroke={variant === 'outline' ? color : '#fff'}
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
