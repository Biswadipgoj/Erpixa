import { useEffect, useRef, useState } from 'react';
import { stagger, useExitThen } from '../../lib/motion';
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

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

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
  const formRef = useRef<HTMLFormElement>(null);
  const { closing, requestClose } = useExitThen(onClose);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitting) requestClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [requestClose, submitting]);

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
      requestClose();
    } catch (err) {
      setSubmitError(friendlyError(err));
      setSubmitting(false);
    }
  };

  // First field (the record's name) runs full width; the rest pair up, and a
  // trailing odd one out stretches so the grid never ends on a hole.
  const spanFull = (i: number) => i === 0 || (i === fields.length - 1 && (fields.length - 1) % 2 === 1);

  return (
    <div className={`modal-backdrop${closing ? ' is-closing' : ''}`} onClick={() => { if (!submitting) requestClose(); }} role="presentation">
      <div className="modal modal-md" role="dialog" aria-modal="true" aria-labelledby="record-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 id="record-modal-title">{title}</h2>
            <p>Fields marked <span style={{ color: 'var(--danger)' }}>*</span> are required.</p>
          </div>
          <button type="button" onClick={requestClose} aria-label="Close dialog" className="icon-btn" disabled={submitting}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'contents' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); formRef.current?.requestSubmit(); } }}
        >
          <div className="modal-body">
            {fields.map((f, i) => {
              const id = `field-${f.name}`;
              const err = errors[f.name];
              return (
                <div className={`field${spanFull(i) ? ' span-2' : ''}`} key={f.name} style={stagger(i)}>
                  <label className="field-label" htmlFor={id}>
                    {f.label}{f.required && <span className="req" aria-hidden="true">*</span>}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      id={id}
                      ref={i === 0 ? (el) => { firstInputRef.current = el; } : undefined}
                      className="tinput select"
                      value={values[f.name]}
                      onChange={(e) => setValue(f.name, e.target.value)}
                    >
                      {asOptions(f.options).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      id={id}
                      ref={i === 0 ? (el) => { firstInputRef.current = el; } : undefined}
                      className={`tinput${f.type === 'number' ? ' num' : ''}`}
                      type={f.type}
                      inputMode={f.type === 'number' ? 'decimal' : undefined}
                      placeholder={f.placeholder}
                      value={values[f.name]}
                      onChange={(e) => setValue(f.name, e.target.value)}
                      aria-invalid={!!err}
                      aria-describedby={err ? `${id}-err` : undefined}
                      required={f.required}
                    />
                  )}
                  {err && <span id={`${id}-err`} role="alert" className="field-error"><Icon name="alert" size={12} strokeWidth={2} />{err}</span>}
                </div>
              );
            })}
            {submitError && (
              <div role="alert" className="notice notice-danger span-2">
                <Icon name="alert" size={16} /><span className="notice-text">{submitError}</span>
              </div>
            )}
          </div>
          <div className="modal-foot">
            <span className="hint hide-sm"><kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>↵</kbd> to save</span>
            <button type="button" className="btn btn-ghost" onClick={requestClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><Icon name="spark" size={15} className="spin" /> Saving…</> : <><Icon name="check" size={15} strokeWidth={2.2} /> {submitLabel}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
