import { useCurrencyStore } from '../store';

/**
 * The currency formatter, subscribed to the selected currency so every figure
 * re-renders when the viewer switches it (the formatter itself is stable).
 */
export function useMoney(): (usdAmount: number, compact?: boolean) => string {
  useCurrencyStore((s) => s.currency.code);
  return useCurrencyStore((s) => s.formatMoney);
}
