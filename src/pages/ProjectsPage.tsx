import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Project } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { PROJECT_FIELDS } from '../lib/recordFields';

export default function ProjectsPage() {
  const projects = useDataStore((s) => s.projects);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
  });

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
    <div className="fade-in">
      <PageHeader
        title="Projects"
        subtitle="Track team progress, deadlines, and deliverables."
        actionLabel="New project"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-violet stagger-1">
          <div className="kpi-label">Active Projects</div>
          <div className="kpi-value">{active}</div>
          <div className="kpi-change">Across all teams</div>
        </div>
        <div className="card kpi-card kpi-blue stagger-2">
          <div className="kpi-label">Tasks Completed</div>
          <div className="kpi-value">{doneTasks} / {totalTasks}</div>
          <div className="kpi-change">Across all projects</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-3">
          <div className="kpi-label">On Track</div>
          <div className="kpi-value">{onTrackPct === null ? '—' : `${onTrackPct}%`}</div>
          <div className="kpi-change">On or ahead of schedule</div>
        </div>
      </div>

      <div className="card">
        {projects.length > 0 && (
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
              <input className="tinput" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
            </div>
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
                  <th>Project</th><th>Client</th><th>Progress</th><th>Due date</th><th>Team</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td>{p.client || '—'}</td>
                    <td style={{ minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="progress" style={{ flex: 1 }}>
                          <div className="progress-bar" style={{ width: `${p.progress}%`, background: p.progress === 100 ? 'var(--emerald-500)' : 'var(--violet-500)' }} />
                        </div>
                        <span className="text-xs font-bold">{p.progress}%</span>
                      </div>
                    </td>
                    <td>{p.dueDate || '—'}</td>
                    <td>
                      {p.team.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <div style={{ display: 'flex' }}>
                          {p.team.map((member, i) => (
                            <div
                              key={i}
                              className="avatar avatar-sm"
                              style={{
                                marginLeft: i > 0 ? -8 : 0,
                                background: 'var(--violet-500)',
                                color: '#fff',
                                border: '2px solid var(--surface)',
                              }}
                              title={member}
                            >
                              {member}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'Completed' ? 'badge-success' :
                        p.status === 'In Progress' ? 'badge-primary' :
                        p.status === 'On Hold' ? 'badge-warning' :
                        'badge-neutral'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td><RowActions onEdit={() => openEdit(p)} onDelete={() => setDeleting(p)} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }} className="text-muted">No projects match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          title="Delete project?"
          message={`“${deleting.name}” will be removed from your projects. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
