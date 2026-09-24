import type { ReactNode } from 'react';
import { stagger, useExitThen } from '../../lib/motion';
import Icon from './Icon';
import { statusTone } from '../../lib/status';

/** Splits text into masked words that slide up one after another. */
export function SplitWords({ text, offset = 0 }: { text: string; offset?: number }) {
  return (
    <>
      {text.split(/\s+/).filter(Boolean).map((word, i, all) => (
        <span key={`${word}-${i}`}>
          <span className="w"><span style={stagger(i + offset, 20)}>{word}</span></span>
          {i < all.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

/** Page title block: eyebrow, word-by-word title reveal, subtitle, actions. */
export function PageHeader({
  eyebrow, icon, title, subtitle, actionLabel, onAction, children,
}: {
  eyebrow?: string;
  icon?: string;
  title: string;
  subtitle?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head-main">
        {eyebrow && (
          <div className="eyebrow">
            {icon && <span className="eyebrow-icon"><Icon name={icon} size={13} strokeWidth={2} /></span>}
            {eyebrow}
          </div>
        )}
        <h1 className="page-title" aria-label={title}><span aria-hidden="true"><SplitWords text={title} /></span></h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {(children || (actionLabel && onAction)) && (
        <div className="page-actions">
          {children}
          {actionLabel && onAction && (
            <button type="button" className="btn btn-primary btn-plus" onClick={onAction}>
              <Icon name="plus" size={16} strokeWidth={2} /> {actionLabel}
            </button>
          )}
        </div>
      )}
    </header>
  );
}

/** Search input with a leading icon, for table toolbars. */
export function SearchInput({ value, onChange, placeholder, label }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label?: string;
}) {
  return (
    <div className="input-affix">
      <span className="affix-icon"><Icon name="search" size={15} /></span>
      <input
        className="tinput"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
      />
    </div>
  );
}

/** Inline edit + delete controls; they surface on row hover or focus. */
export function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label?: string }) {
  const suffix = label ? ` ${label}` : '';
  return (
    <div className="row-actions">
      <button type="button" className="icon-btn sm" onClick={onEdit} title="Edit" aria-label={`Edit${suffix}`}>
        <Icon name="edit" size={15} />
      </button>
      <button type="button" className="icon-btn sm danger" onClick={onDelete} title="Delete" aria-label={`Delete${suffix}`}>
        <Icon name="trash" size={15} />
      </button>
    </div>
  );
}

/** Empty state: a small stack of ledger sheets with the module's icon. */
export function EmptyState({
  icon = 'inbox', title, message, actionLabel, onAction, compact,
}: {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`empty${compact ? ' compact' : ''}`}>
      <div className="empty-art" aria-hidden="true">
        <div className="empty-sheet back" />
        <div className="empty-sheet">
          <i /><i /><i />
          <span className="empty-badge"><Icon name={icon} size={18} /></span>
        </div>
      </div>
      <div className="empty-title">{title}</div>
      {message && <p className="empty-msg">{message}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary btn-plus" onClick={onAction}>
          <Icon name="plus" size={16} strokeWidth={2} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

/** Confirmation dialog for destructive actions. */
export function ConfirmDialog({
  title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { closing, requestClose } = useExitThen(onCancel);
  const cancel = () => { if (!busy) requestClose(); };
  return (
    <div
      className={`modal-backdrop${closing ? ' is-closing' : ''}`}
      onClick={cancel}
      onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
      role="presentation"
    >
      <div className="modal modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg" onClick={(e) => e.stopPropagation()}>
        <div className="confirm">
          <div className="confirm-icon" aria-hidden="true"><Icon name="trash" size={19} /></div>
          <div>
            <h2 id="confirm-title">{title}</h2>
            <p id="confirm-msg">{message}</p>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={cancel} disabled={busy} autoFocus>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? <><Icon name="spark" size={15} className="spin" /> Deleting…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Status pill with a dot; tone comes from `statusTone`. */
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${statusTone(status)}`}>{status}</span>;
}
