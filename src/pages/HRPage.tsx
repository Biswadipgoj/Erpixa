import { useMemo, useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Employee } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput, StatusBadge } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { EMPLOYEE_FIELDS } from '../lib/recordFields';
import { moduleById } from '../lib/modules';
import { shortDate } from '../lib/format';
import { stagger } from '../lib/motion';
import Icon from '../components/ui/Icon';

const STATUS_DOT: Record<string, string> = { Active: 'var(--success)', 'On Leave': 'var(--warning)', Terminated: 'var(--danger)' };

export default function HRPage() {
  const employees = useDataStore((s) => s.employees);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.dept).filter(Boolean))).sort(),
    [employees],
  );

  const q = search.toLowerCase();
  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.dept.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q);
    return matchesSearch && (dept === 'all' || e.dept === dept);
  });

  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;

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
    <div className="page">
      <PageHeader
        eyebrow={moduleById('hr').group}
        icon="hr"
        title="Human resources"
        subtitle={moduleById('hr').blurb}
        actionLabel="Add employee"
        onAction={openCreate}
      />

      <Stats cols={3}>
        <Stat index={0} label="Headcount" value={employees.length} caption={<><strong>{departments.length}</strong> department{departments.length === 1 ? '' : 's'}</>} tone="accent" icon="hr" />
        <Stat index={1} label="Active" value={activeCount} caption="Currently working" tone="success" icon="check" />
        <Stat index={2} label="On leave" value={onLeaveCount} caption="Temporarily away" tone={onLeaveCount > 0 ? 'warning' : 'neutral'} icon="calendar" />
      </Stats>

      <section className="card section" aria-label="Team directory">
        {employees.length > 0 && (
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, title, department or email…" />
            {departments.length > 1 && (
              <select className="tinput select" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Filter by department">
                <option value="all">All departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <span className="toolbar-meta">{filtered.length} of {employees.length}</span>
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
        ) : filtered.length === 0 ? (
          <div className="empty compact"><p className="empty-msg">No one matches these filters.</p></div>
        ) : (
          <div className="people">
            {filtered.map((e, i) => (
              <article key={e.id} className="card person lift reveal-host" style={stagger(i)}>
                <div className="person-top">
                  <span style={{ position: 'relative', flexShrink: 0 }}>
                    <span className="avatar avatar-lg filled" style={{ background: e.color }} aria-hidden="true">{e.initials}</span>
                    <span className="status-dot" style={{ background: STATUS_DOT[e.status] ?? 'var(--ink-4)' }} aria-hidden="true" />
                  </span>
                  <div style={{ minWidth: 0, paddingRight: 56 }}>
                    <h3 className="person-name truncate">{e.name}</h3>
                    <div className="person-role truncate">{e.role || 'No title yet'}</div>
                  </div>
                </div>
                <div className="badge-row">
                  <span className="badge no-dot">{e.dept || 'Unassigned'}</span>
                  <StatusBadge status={e.status} />
                </div>
                <div className="person-contact">
                  <span><Icon name="mail" size={14} />{e.email ? <a className="truncate" href={`mailto:${e.email}`}>{e.email}</a> : <span className="muted">No email</span>}</span>
                  <span><Icon name="phone" size={14} />{e.phone ? <a href={`tel:${e.phone}`}>{e.phone}</a> : <span className="muted">No phone</span>}</span>
                  {e.joinDate && <span><Icon name="calendar" size={14} />Joined {shortDate(e.joinDate)}</span>}
                </div>
                <RowActions label={e.name} onEdit={() => openEdit(e)} onDelete={() => setDeleting(e)} />
              </article>
            ))}
          </div>
        )}
      </section>

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
          title="Remove this employee?"
          message={`“${deleting.name}” will be removed from your team directory. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
