import { useEffect, useRef, useState } from 'react';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'email' | 'tel';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  defaultValue?: string;
}

interface RecordModalProps {
  title: string;
  submitLabel?: string;
  gradient?: string;
  fields: FieldDef[];
  onSubmit: (values: Record<string, string | number>) => Promise<void>;
  onClose: () => void;
}

/** Generic "create record" modal driven by a field definition list. */
export default function RecordModal({ title, submitLabel = 'Create', gradient, fields, onSubmit, onClose }: RecordModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? (f.type === 'select' ? f.options?.[0] ?? '' : '')]))
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
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal-sm"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={gradient ? ({ '--hero-grad': gradient } as React.CSSProperties) : undefined}>
          <h3>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
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
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
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
              <div role="alert" style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: `1px solid var(--danger-border)`, borderRadius: 10, color: 'var(--danger)', fontSize: '0.875rem' }}>
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
