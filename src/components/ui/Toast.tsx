import { useUIStore } from '../../store';
import type { Toast } from '../../store';

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
  const icons: Record<Toast['type'], string> = { success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️' };
  return (
    <div className={`toast toast-${toast.type}`} style={{ animation: 'slideInRight 0.2s ease' }}>
      <span>{icons[toast.type]}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
      >×</button>
    </div>
  );
}
