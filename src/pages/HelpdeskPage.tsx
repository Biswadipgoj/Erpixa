import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Ticket } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput, StatusBadge } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { TICKET_FIELDS } from '../lib/recordFields';
import { moduleById } from '../lib/modules';
import { initialsOf } from '../lib/format';
import { stagger } from '../lib/motion';

const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];

export default function HelpdeskPage() {
  const tickets = useDataStore((s) => s.tickets);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [view, setView] = useState<'open' | 'all' | 'resolved'>('open');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);

  const q = search.toLowerCase();
  const filtered = tickets
    .filter((t) =>
      (t.title.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q)) &&
      (view === 'all' || (view === 'open' ? t.status !== 'Resolved' : t.status === 'Resolved')))
    // Most urgent first, so the queue reads top-down.
    .sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority));

  const openCount = tickets.filter((t) => t.status !== 'Resolved').length;
  const urgentCount = tickets.filter((t) => t.priority === 'Urgent' && t.status !== 'Resolved').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;
  const views: { id: typeof view; label: string; count: number }[] = [
    { id: 'open', label: 'Open', count: openCount },
    { id: 'resolved', label: 'Resolved', count: resolvedCount },
    { id: 'all', label: 'All', count: tickets.length },
  ];

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

  const viewIndex = views.findIndex((v) => v.id === view);

  return (
    <div className="page">
      <PageHeader
        eyebrow={moduleById('helpdesk').group}
        icon="helpdesk"
        title="Helpdesk"
        subtitle={moduleById('helpdesk').blurb}
        actionLabel="New ticket"
        onAction={openCreate}
      />

      <Stats cols={3}>
        <Stat index={0} label="Open tickets" value={openCount} caption="Waiting on your team" tone="accent" icon="inbox" />
        <Stat index={1} label="Urgent" value={urgentCount} caption="Open and marked urgent" tone={urgentCount > 0 ? 'danger' : 'neutral'} icon="alert" />
        <Stat index={2} label="Resolved" value={resolvedCount} caption="Closed out" tone="success" icon="check" />
      </Stats>

      <section className="card section" aria-label="Tickets">
        {tickets.length > 0 && (
          <div className="toolbar">
            <div className="segmented" role="tablist" aria-label="Ticket view" style={{ minWidth: 280 }}>
              <span className="segmented-thumb" aria-hidden="true" style={{ width: 'calc((100% - 6px) / 3)', transform: `translateX(${viewIndex * 100}%)` }} />
              {views.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} style={{ height: 30, fontSize: 'var(--t-sm)' }}>
                  {v.label} <span className="muted num">{v.count}</span>
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search subject, customer or assignee…" />
          </div>
        )}

        {tickets.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="No tickets yet"
            message="Log your first support ticket to start tracking customer issues."
            actionLabel="New ticket"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th><th>Priority</th><th>Status</th><th>Assignee</th>
                  <th className="actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody key={view}>
                {filtered.map((t, i) => (
                  <tr key={t.id} style={stagger(i)}>
                    <td>
                      <div className="cell-main">{t.title}</div>
                      <div className="cell-sub">{t.customer || 'No customer'}</div>
                    </td>
                    <td><StatusBadge status={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      {t.assignee ? (
                        <div className="cell-person">
                          <span className="avatar avatar-sm filled" style={{ background: 'var(--ink-2)', color: 'var(--paper)' }} aria-hidden="true">{initialsOf(t.assignee)}</span>
                          <span className="truncate">{t.assignee}</span>
                        </div>
                      ) : (
                        <span className="badge badge-warning no-dot">Unassigned</span>
                      )}
                    </td>
                    <td className="actions"><RowActions label={t.title} onEdit={() => openEdit(t)} onDelete={() => setDeleting(t)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="empty-row"><td colSpan={5}>{view === 'open' && !search ? 'No open tickets — the queue is clear.' : 'No tickets match these filters.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
          title="Delete this ticket?"
          message={`“${deleting.title}” will be removed from your helpdesk. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
