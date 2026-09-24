// Small motion toolkit — no animation library, just the few behaviours CSS
// can't express on its own. Everything here respects prefers-reduced-motion.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** True when the viewer has asked the OS for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}

/** Inline style that feeds a stagger index to CSS (capped so long lists don't crawl). */
export const stagger = (i: number, cap = 14): CSSProperties => ({ '--i': Math.min(i, cap) } as CSSProperties);

/**
 * Animates a number from its previous value to `target` with an ease-out
 * curve. Returns the in-flight value; callers format it for display.
 */
export function useCountUp(target: number, duration = 1100, delay = 0): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (reduced || !Number.isFinite(target)) {
      current.current = target;
      setValue(target);
      return;
    }
    const from = current.current;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 4);
      const v = from + (target - from) * eased;
      current.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay, reduced]);

  return value;
}

type PresenceState = 'closed' | 'open' | 'closing';

/**
 * Keeps an element mounted long enough to play its exit animation.
 * `closing` is true for `exitMs` after `open` flips to false.
 */
export function usePresence(open: boolean, exitMs = 200): { mounted: boolean; closing: boolean } {
  const [state, setState] = useState<PresenceState>(open ? 'open' : 'closed');
  if (open && state !== 'open') setState('open');
  if (!open && state === 'open') setState('closing');

  useEffect(() => {
    if (state !== 'closing') return;
    const t = window.setTimeout(() => setState('closed'), exitMs);
    return () => window.clearTimeout(t);
  }, [state, exitMs]);

  return { mounted: state !== 'closed', closing: state === 'closing' };
}

/**
 * For components the parent unmounts directly (`{open && <Modal/>}`):
 * returns a `closing` flag and a `requestClose` that plays the exit first.
 */
export function useExitThen(onDone: () => void, exitMs = 200): { closing: boolean; requestClose: () => void } {
  const [closing, setClosing] = useState(false);
  const reduced = useReducedMotion();
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => done.current(), reduced ? 0 : exitMs);
    return () => window.clearTimeout(t);
  }, [closing, exitMs, reduced]);

  return { closing, requestClose: () => setClosing(true) };
}

/**
 * Global pointer effects, installed once at the app root:
 *  - ink ripple from the press point on every `.btn`
 *  - pointer-tracked light on every `.spotlight`
 */
export function useInteractionEffects(): void {
  useEffect(() => {
    if (window.matchMedia(REDUCED_QUERY).matches) return;

    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('.btn');
      if (!el || (el as HTMLButtonElement).disabled) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--rx', `${e.clientX - r.left}px`);
      el.style.setProperty('--ry', `${e.clientY - r.top}px`);
      el.style.setProperty('--rs', String((Math.max(r.width, r.height) * 2.4) / 12));
      el.classList.remove('rippling');
      void el.offsetWidth; // restart the animation
      el.classList.add('rippling');
    };

    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('.spotlight');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };

    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
    };
  }, []);
}

/** Closes something when a pointer lands outside `ref` or Escape is pressed. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void): void {
  const cb = useRef(onDismiss);
  useEffect(() => { cb.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cb.current(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, ref]);
}
