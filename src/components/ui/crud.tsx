import type { ReactNode } from 'react';
import Icon from './Icon';

/** Page title bar with an optional primary action. */
export function PageHeader({
  title, subtitle, actionLabel, onAction, children,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="page-hero">
      <div>
        <h1 className="page-hero-title">{title}</h1>
        <div className="page-hero-sub">{subtitle}</div>
      </div>
      <div className="page-hero-actions">
        {children}
        {actionLabel && onAction && (
          <button type="button" className="btn btn-primary" onClick={onAction}>
            <Icon name="plus" size={16} /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Inline edit + delete controls for a table row or card. */
export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
      <button type="button" className="topnav-icon-btn" style={{ width: 30, height: 30 }} onClick={onEdit} title="Edit" aria-label="Edit">
        <Icon name="edit" size={15} />
      </button>
      <button
        type="button"
        className="topnav-icon-btn"
        style={{ width: 30, height: 30 }}
        onClick={onDelete}
        title="Delete"
        aria-label="Delete"
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
      >
        <Icon name="trash" size={15} />
      </button>
    </div>
  );
}

/** Empty-state block for tables, grids, and boards. */
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
    <div className="empty-state" style={compact ? { padding: '36px 20px' } : undefined}>
      <div className="empty-state-icon"><Icon name={icon} size={22} /></div>
      <div className="empty-state-title">{title}</div>
      {message && <p style={{ maxWidth: 340, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{message}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction} style={{ marginTop: 4 }}>
          <Icon name="plus" size={15} /> {actionLabel}
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
  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal modal-sm" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--r-full)', background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="alert" size={18} />
          </div>
          <div>
            <h3 style={{ marginBottom: 4 }}>{title}</h3>
            <p style={{ fontSize: '0.875rem' }}>{message}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
