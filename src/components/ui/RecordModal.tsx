import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'email' | 'tel';
  required?: boolean;
  options?: { value: string; label: string }[] | string[];
  placeholder?: string;
  min?: number;
  defaultValue?: string;
}

interface RecordModalProps {
  title: string;
  submitLabel?: string;
  fields: FieldDef[];
  /** Prefills the form for editing an existing record. */
  initial?: Record<string, string | number | null | undefined>;
  onSubmit: (values: Record<string, string | number>) => Promise<void>;
  onClose: () => void;
}

const asOptions = (opts: FieldDef['options']) =>
  (opts ?? []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

/** Turns a raw Supabase/network error into a human-friendly sentence. */
function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? '');
  const lower = message.toLowerCase();
  if (lower.includes('duplicate') || lower.includes('23505') || lower.includes('already exists')) {
    return 'A record with those details already exists.';
  }
  if (lower.includes('row-level security') || lower.includes('permission') || lower.includes('42501')) {
    return 'You don’t have permission to do this.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'We couldn’t reach the server. Check your internet connection and try again.';
  }
  return message || 'Something unexpected happened. Please try again.';
}

/** Generic create/edit modal driven by a field definition list. */
export default function RecordModal({ title, submitLabel = 'Save', fields, initial, onSubmit, onClose }: RecordModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => {
      const seed = initial?.[f.name];
      if (seed !== undefined && seed !== null) return [f.name, String(seed)];
      return [f.name, f.defaultValue ?? (f.type === 'select' ? asOptions(f.options)[0]?.value ?? '' : '')];
    }))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const firstInputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setValue = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const raw = values[f.name]?.trim() ?? '';
      if (f.required && !raw) next[f.name] = `${f.label} is required.`;
      else if (f.type === 'number' && raw && Number.isNaN(Number(raw))) next[f.name] = 'Enter a valid number.';
      else if (f.type === 'number' && raw && f.min !== undefined && Number(raw) < f.min) next[f.name] = `Must be at least ${f.min}.`;
      else if (f.type === 'email' && raw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) next[f.name] = 'Enter a valid email address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const parsed: Record<string, string | number> = {};
      for (const f of fields) {
        const raw = values[f.name]?.trim() ?? '';
        parsed[f.name] = f.type === 'number' ? Number(raw || 0) : raw;
      }
      await onSubmit(parsed);
      onClose();
    } catch (err) {
      setSubmitError(friendlyError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="topnav-icon-btn">
            <Icon name="close" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fields.map((f, i) => (
              <div className="input-wrap" key={f.name}>
                <label className="input-label" htmlFor={`field-${f.name}`}>
                  {f.label}{f.required && <span aria-hidden="true" style={{ color: 'var(--danger)' }}> *</span>}
                </label>
                {f.type === 'select' ? (
                  <select
                    id={`field-${f.name}`}
                    ref={i === 0 ? (el) => { firstInputRef.current = el; } : undefined}
                    className="tinput select"
                    value={values[f.name]}
                    onChange={(e) => setValue(f.name, e.target.value)}
                  >
                    {asOptions(f.options).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input
                    id={`field-${f.name}`}
                    ref={i === 0 ? (el) => { firstInputRef.current = el; } : undefined}
                    className="tinput"
                    type={f.type}
                    inputMode={f.type === 'number' ? 'decimal' : undefined}
                    placeholder={f.placeholder}
                    value={values[f.name]}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    aria-invalid={!!errors[f.name]}
                  />
                )}
                {errors[f.name] && (
                  <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>{errors[f.name]}</span>
                )}
              </div>
            ))}
            {submitError && (
              <div role="alert" style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 8, color: 'var(--danger)', fontSize: '0.85rem' }}>
                {submitError}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
