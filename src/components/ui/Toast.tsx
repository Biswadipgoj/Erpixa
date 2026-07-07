import { useUIStore } from '../../store';
import type { Toast } from '../../store';
import Icon from './Icon';

const TOAST_ICON: Record<Toast['type'], string> = {
  success: 'check', danger: 'alert', warning: 'alert', info: 'bell',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />)}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon"><Icon name={TOAST_ICON[toast.type]} size={18} /></span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} className="topnav-icon-btn" style={{ width: 24, height: 24 }} aria-label="Dismiss">
        <Icon name="close" size={15} />
      </button>
    </div>
  );
}
