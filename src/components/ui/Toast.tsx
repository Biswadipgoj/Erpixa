import { useUIStore } from '../../store';
import type { Toast } from '../../store';
import Icon from './Icon';

const TOAST_ICON: Record<Toast['type'], string> = {
  success: 'check', danger: 'alert', warning: 'alert', info: 'info',
};

/** Inverted toasts that slide in, drain a timer line, and slide out. */
export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);
  return (
    <div className="toast-stack" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'danger' ? 'alert' : 'status'}>
          <span className="toast-icon" aria-hidden="true"><Icon name={TOAST_ICON[t.type]} size={15} strokeWidth={2.2} /></span>
          <span className="toast-msg">{t.message}</span>
          <button type="button" onClick={() => removeToast(t.id)} className="toast-close" aria-label="Dismiss notification">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
