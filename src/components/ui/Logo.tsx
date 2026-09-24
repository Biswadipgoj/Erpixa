/**
 * The Erpixa mark: three ledger entries that read as an "E", closed by the
 * accountant's double rule. `variant="paper"` inverts it for light grounds;
 * `animate` draws the strokes in, `loop` keeps drawing (splash screens).
 */
export default function Logo({
  size = 32, variant = 'cover', animate, loop, className = '',
}: {
  size?: number;
  variant?: 'cover' | 'paper';
  animate?: boolean;
  loop?: boolean;
  className?: string;
}) {
  const cls = ['logo-mark', variant === 'paper' && 'on-paper', (animate || loop) && 'animate', loop && 'loop', className]
    .filter(Boolean).join(' ');
  return (
    <svg className={cls} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect className="l-bg" width="32" height="32" rx="9" />
      <path className="l-line" pathLength={1} d="M9 9.5h14" />
      <path className="l-line" pathLength={1} d="M9 14.5h9" />
      <path className="l-line" pathLength={1} d="M9 19.5h14" />
      <path className="l-rule" pathLength={1} d="M9 23.6h14" />
      <path className="l-rule" pathLength={1} d="M9 25.9h14" />
    </svg>
  );
}
