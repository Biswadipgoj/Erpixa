import { useMemo, useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Employee } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { EMPLOYEE_FIELDS } from '../lib/recordFields';
import Icon from '../components/ui/Icon';

export default function HRPage() {
  const employees = useDataStore((s) => s.employees);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.dept.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.dept).filter(Boolean))).sort(),
    [employees],
  );

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (e: Employee) => { setEditing(e); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('employees', editing.id, values);
      addToast({ message: 'Employee updated.', type: 'success' });
    } else {
      await addRecord('employees', values);
      addToast({ message: 'Employee added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('employees', deleting.id);
      addToast({ message: 'Employee deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the employee.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    name: editing.name, role: editing.role, dept: editing.dept,
    email: editing.email, phone: editing.phone, status: editing.status, join_date: editing.joinDate,
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Human Resources"
        subtitle="Manage your team, track headcount, and keep records up to date."
        actionLabel="Add employee"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-indigo stagger-1">
          <div className="kpi-label">Total Headcount</div>
          <div className="kpi-value">{employees.length}</div>
          <div className="kpi-change">{departments.length} department{departments.length === 1 ? '' : 's'}</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-2">
          <div className="kpi-label">Active</div>
          <div className="kpi-value">{activeCount}</div>
          <div className="kpi-change">Currently working</div>
        </div>
        <div className="card kpi-card kpi-amber stagger-3">
          <div className="kpi-label">On Leave</div>
          <div className="kpi-value">{onLeaveCount}</div>
          <div className="kpi-change">Temporarily away</div>
        </div>
      </div>

      <div className="card">
        {employees.length > 0 && (
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <input className="tinput" placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
            </div>
          </div>
        )}

        {employees.length === 0 ? (
          <EmptyState
            icon="hr"
            title="No employees yet"
            message="Add your first employee to start building out your team directory."
            actionLabel="Add employee"
            onAction={openCreate}
          />
        ) : (
          <div className="card-body">
            <div className="grid-auto">
              {filtered.map((e) => (
                <div key={e.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div className="avatar avatar-lg" style={{ background: e.color, color: '#fff', flexShrink: 0 }}>
                        {e.initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="font-bold" style={{ marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</h3>
                        <div className="text-sm font-semibold text-primary-color">{e.role || '—'}</div>
                      </div>
                    </div>
                    <RowActions onEdit={() => openEdit(e)} onDelete={() => setDeleting(e)} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral">{e.dept || 'Unassigned'}</span>
                    <span className={`badge ${e.status === 'Active' ? 'badge-success' : e.status === 'Terminated' ? 'badge-danger' : 'badge-warning'}`}>
                      {e.status}
                    </span>
                  </div>

                  <div className="text-xs text-muted" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="mail" size={14} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.email || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="phone" size={14} /> <span>{e.phone || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32 }} className="text-muted">No employees match your filters.</div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit employee' : 'New employee'}
          submitLabel={editing ? 'Save changes' : 'Add employee'}
          fields={EMPLOYEE_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete employee?"
          message={`“${deleting.name}” will be removed from your team directory. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
