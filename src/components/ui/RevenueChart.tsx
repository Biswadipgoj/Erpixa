import { useLayoutEffect, useRef, useState } from 'react';

export interface ChartPoint { key: string; label: string; value: number }

const HEIGHT = 220;
const PAD = { top: 20, right: 16, bottom: 28, left: 52 };

/** Rounds a maximum up to a clean axis value (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * exp;
}

/**
 * Single-series area chart: 2px line over a 10% wash, hairline grid, value
 * at the end, and a crosshair + tooltip that snaps to the nearest month.
 * Pointer and arrow keys both move the readout; a hidden table carries the
 * same numbers for screen readers.
 */
export default function RevenueChart({ points, format, formatCompact, caption }: {
  points: ChartPoint[];
  format: (v: number) => string;
  formatCompact: (v: number) => string;
  caption: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = n > 0 ? `${line} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : '';
  const ticks = [0, max / 2, max];
  const last = points[n - 1];

  const indexAt = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return null;
    const rel = clientX - rect.left - PAD.left;
    return Math.max(0, Math.min(n - 1, Math.round((rel / innerW) * (n - 1))));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setHover((h) => Math.min(n - 1, (h ?? n - 1) + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setHover((h) => Math.max(0, (h ?? n - 1) - 1)); }
    if (e.key === 'Escape') setHover(null);
  };

  const hp = hover !== null ? points[hover] : null;

  if (points.every((p) => p.value === 0)) {
    return (
      <div className="chart" ref={wrapRef}>
        <div className="chart-empty">
          <svg width="100%" height="64" viewBox="0 0 400 64" preserveAspectRatio="none" aria-hidden="true">
            <path className="series-line" d="M0 48 C60 46 90 30 140 34 S220 16 270 22 S350 8 400 12" style={{ opacity: 0.35, strokeDasharray: '4 6' }} />
          </svg>
          <p>No dated orders in the last {n} months yet — revenue will chart here as orders come in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart" ref={wrapRef}>
      <svg width={width} height={HEIGHT} role="img" aria-label={caption}>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'base-line' : 'grid-line'} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="axis-label" x={PAD.left - 10} y={y(t) + 4} textAnchor="end">{formatCompact(t)}</text>
          </g>
        ))}
        {points.map((p, i) => (
          <text key={p.key} className="axis-label" x={x(i)} y={HEIGHT - 6} textAnchor="middle">{p.label}</text>
        ))}
        {n > 0 && <path className="series-area" d={area} />}
        {n > 0 && <path className="series-line" d={line} pathLength={1} />}
        {last && (
          <>
            <circle className="end-dot" cx={x(n - 1)} cy={y(last.value)} r={4.5} />
            <text className="end-label" x={x(n - 1) - 10} y={y(last.value) - 12} textAnchor="end">{formatCompact(last.value)}</text>
          </>
        )}
        {hp && hover !== null && (
          <g aria-hidden="true">
            <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top - 6} y2={y(0)} />
            <circle className="hover-dot" cx={x(hover)} cy={y(hp.value)} r={5} />
          </g>
        )}
        <rect
          className="chart-hit"
          x={PAD.left - 12}
          y={0}
          width={innerW + 24}
          height={HEIGHT - PAD.bottom}
          fill="transparent"
          tabIndex={0}
          aria-label="Monthly revenue, use arrow keys to read each month"
          onPointerMove={(e) => setHover(indexAt(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(n - 1)}
          onBlur={() => setHover(null)}
          onKeyDown={onKey}
        />
      </svg>
      {hp && hover !== null && (
        <div className="chart-tip" style={{ left: Math.min(Math.max(x(hover), 70), width - 70), top: y(hp.value) - 6 }}>
          <strong>{format(hp.value)}</strong>
          <span className="key" />{hp.label} revenue
        </div>
      )}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">Month</th><th scope="col">Revenue</th></tr></thead>
        <tbody>{points.map((p) => <tr key={p.key}><td>{p.label}</td><td>{format(p.value)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
