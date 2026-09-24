// Small display helpers shared across pages.

/** Initials for a person's name, e.g. "Priya Sharma" -> "PS"; falls back to the email. */
export function initialsOf(name: string, email = ''): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')
    || email.slice(0, 2).toUpperCase()
    || '?';
}

/** "Good morning" / "Good afternoon" / "Good evening" for the local hour. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Local calendar date for a YYYY-MM-DD string, or an em dash when empty. */
export function shortDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
