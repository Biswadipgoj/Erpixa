import type { CSSProperties, ReactNode } from 'react';
import { stagger, useCountUp } from '../../lib/motion';
import Icon from './Icon';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const plain = (n: number) => Math.round(n).toLocaleString();

/** Renders a number that counts up from zero (or its last value) on change. */
export function CountUp({ value, format = plain, duration, delay }: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
}) {
  const v = useCountUp(value, duration, delay);
  // The live region reads the final figure; the ticking one is decorative.
  return (
    <>
      <span aria-hidden="true">{format(v)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

/**
 * KPI tile. The figure counts up, then the accountant's double rule draws in
 * beneath it. `display` overrides the animated number for non-numeric values.
 */
export function Stat({
  label, value, format, display, caption, tone = 'neutral', icon, index = 0,
}: {
  label: string;
  value?: number;
  format?: (n: number) => string;
  display?: string;
  caption?: ReactNode;
  tone?: Tone;
  icon?: string;
  index?: number;
}) {
  return (
    <div className={`card stat spotlight lift tone-${tone}`} style={stagger(index)}>
      <div className="stat-head">
        <span className="stat-dot" aria-hidden="true" />
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>}
      </div>
      <div className="stat-value">
        {display ?? <CountUp value={value ?? 0} format={format} delay={index * 70} />}
      </div>
      {caption && <div className="stat-caption">{caption}</div>}
    </div>
  );
}

/** A row of stat tiles; `cols` sets the desktop column count. */
export function Stats({ cols = 3, children }: { cols?: number; children: ReactNode }) {
  return <div className="stats" style={{ '--cols': cols } as CSSProperties}>{children}</div>;
}
