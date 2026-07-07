import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Ticket } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { TICKET_FIELDS } from '../lib/recordFields';

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
}

export default function HelpdeskPage() {
  const tickets = useDataStore((s) => s.tickets);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.customer.toLowerCase().includes(q) ||
      t.assignee.toLowerCase().includes(q)
    );
  });

  const openCount = tickets.filter((t) => t.status !== 'Resolved').length;
  const urgentCount = tickets.filter((t) => t.priority === 'Urgent').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: Ticket) => { setEditing(t); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('tickets', editing.id, values);
      addToast({ message: 'Ticket updated.', type: 'success' });
    } else {
      await addRecord('tickets', values);
      addToast({ message: 'Ticket added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('tickets', deleting.id);
      addToast({ message: 'Ticket deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the ticket.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    title: editing.title, customer: editing.customer, priority: editing.priority,
    status: editing.status, assignee: editing.assignee,
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Helpdesk"
        subtitle="Resolve customer issues and manage support tickets."
        actionLabel="New ticket"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-teal stagger-1">
          <div className="kpi-label">Open Tickets</div>
          <div className="kpi-value">{openCount}</div>
          <div className="kpi-change">Needs attention</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-2">
          <div className="kpi-label">Urgent Issues</div>
          <div className="kpi-value">{urgentCount}</div>
          <div className="kpi-change">Immediate action required</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-3">
          <div className="kpi-label">Resolved</div>
          <div className="kpi-value">{resolvedCount}</div>
          <div className="kpi-change">Closed tickets</div>
        </div>
      </div>

      <div className="card">
        {tickets.length > 0 && (
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <input className="tinput" placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
            </div>
          </div>
        )}

        {tickets.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="No tickets yet"
            message="Create your first support ticket to start tracking customer issues."
            actionLabel="New ticket"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th><th>Customer</th><th>Priority</th><th>Status</th><th>Assignee</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="font-semibold">{t.title}</td>
                    <td>{t.customer || '—'}</td>
                    <td>
                      <span className={`badge ${
                        t.priority === 'Urgent' ? 'badge-danger' :
                        t.priority === 'High' ? 'badge-warning' :
                        t.priority === 'Medium' ? 'badge-info' :
                        'badge-neutral'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        t.status === 'Resolved' ? 'badge-success' :
                        t.status === 'In Progress' ? 'badge-soft-primary' :
                        'badge-neutral'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm">{initialsOf(t.assignee)}</div>
                          <span>{t.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td><RowActions onEdit={() => openEdit(t)} onDelete={() => setDeleting(t)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }} className="text-muted">No tickets match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit ticket' : 'New ticket'}
          submitLabel={editing ? 'Save changes' : 'Add ticket'}
          fields={TICKET_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete ticket?"
          message={`“${deleting.title}” will be removed from your helpdesk. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
