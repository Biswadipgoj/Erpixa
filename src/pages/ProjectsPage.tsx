import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Project } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput, StatusBadge } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { PROJECT_FIELDS } from '../lib/recordFields';
import { moduleById } from '../lib/modules';
import { shortDate } from '../lib/format';
import { stagger } from '../lib/motion';

const STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed'];

export default function ProjectsPage() {
  const projects = useDataStore((s) => s.projects);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);

  const q = search.toLowerCase();
  const filtered = projects.filter((p) =>
    (p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)) && (status === 'all' || p.status === status));

  const today = new Date().toISOString().slice(0, 10);
  const active = projects.filter((p) => p.status === 'In Progress').length;
  const doneTasks = projects.reduce((acc, p) => acc + p.done, 0);
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks, 0);
  const onTrack = projects.filter(
    (p) => p.status === 'Completed' || !p.dueDate || new Date(p.dueDate) >= new Date(),
  ).length;
  const onTrackPct = projects.length ? Math.round((onTrack / projects.length) * 100) : null;

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('projects', editing.id, values);
      addToast({ message: 'Project updated.', type: 'success' });
    } else {
      await addRecord('projects', values);
      addToast({ message: 'Project added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('projects', deleting.id);
      addToast({ message: 'Project deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the project.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    name: editing.name, client: editing.client, status: editing.status,
    progress: editing.progress, due_date: editing.dueDate,
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow={moduleById('projects').group}
        icon="projects"
        title="Projects"
        subtitle={moduleById('projects').blurb}
        actionLabel="New project"
        onAction={openCreate}
      />

      <Stats cols={3}>
        <Stat index={0} label="Active projects" value={active} caption={<><strong>{projects.length}</strong> in total</>} tone="accent" icon="projects" />
        <Stat index={1} label="Tasks completed" value={doneTasks} caption={<>of <strong>{totalTasks}</strong> across all projects</>} tone="info" icon="check" />
        <Stat index={2} label="On track" value={onTrackPct ?? 0} display={onTrackPct === null ? '—' : undefined} format={(v) => `${Math.round(v)}%`} caption="Completed, or not yet due" tone="success" icon="target" />
      </Stats>

      <section className="card section" aria-label="Projects">
        {projects.length > 0 && (
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by project or client…" />
            <select className="tinput select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="toolbar-meta">{filtered.length} of {projects.length}</span>
          </div>
        )}

        {projects.length === 0 ? (
          <EmptyState
            icon="projects"
            title="No projects yet"
            message="Create your first project to track progress, deadlines, and deliverables."
            actionLabel="New project"
            onAction={openCreate}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th><th>Progress</th><th>Due</th><th>Team</th><th>Status</th>
                  <th className="actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const late = p.status !== 'Completed' && !!p.dueDate && p.dueDate < today;
                  return (
                    <tr key={p.id} style={stagger(i)}>
                      <td>
                        <div className="cell-main">{p.name}</div>
                        <div className="cell-sub">{p.client || 'Internal'}</div>
                      </td>
                      <td style={{ minWidth: 200 }}>
                        <div className="meter-row">
                          <div className={`meter${p.progress >= 100 ? ' done' : ''}`}>
                            <i style={{ '--v': Math.min(100, p.progress) / 100 } as React.CSSProperties} />
                          </div>
                          <span className="num">{p.progress}%</span>
                        </div>
                      </td>
                      <td style={late ? { color: 'var(--danger)', fontWeight: 500 } : undefined} className={late ? '' : 'muted'}>
                        {shortDate(p.dueDate)}{late && <span className="sr-only"> (overdue)</span>}
                      </td>
                      <td>
                        {p.team.length === 0 ? (
                          <span className="muted">—</span>
                        ) : (
                          <div className="avatar-stack" aria-label={`Team: ${p.team.join(', ')}`}>
                            {p.team.slice(0, 4).map((member, j) => (
                              <span key={j} className="avatar avatar-sm filled" style={{ background: 'var(--ink-2)', color: 'var(--paper)', ...stagger(j) }} title={member}>
                                {member}
                              </span>
                            ))}
                            {p.team.length > 4 && <span className="avatar avatar-sm" style={stagger(4)}>+{p.team.length - 4}</span>}
                          </div>
                        )}
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="actions"><RowActions label={p.name} onEdit={() => openEdit(p)} onDelete={() => setDeleting(p)} /></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr className="empty-row"><td colSpan={6}>No projects match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit project' : 'New project'}
          submitLabel={editing ? 'Save changes' : 'Add project'}
          fields={PROJECT_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this project?"
          message={`“${deleting.name}” will be removed from your projects. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
