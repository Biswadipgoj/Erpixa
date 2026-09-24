import { useSyncExternalStore } from 'react';
import type { ThemePref } from '../store';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** The theme actually on screen: an explicit choice, or the OS when 'system'. */
export function useResolvedTheme(pref: ThemePref): 'light' | 'dark' {
  const osDark = useSyncExternalStore(subscribe, () => window.matchMedia(DARK_QUERY).matches, () => false);
  if (pref === 'system') return osDark ? 'dark' : 'light';
  return pref;
}
