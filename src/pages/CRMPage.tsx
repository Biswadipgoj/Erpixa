import { useState } from 'react';
import { useCurrencyStore, useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Lead } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog } from '../components/ui/crud';
import { LEAD_FIELDS } from '../lib/recordFields';
import { CRM_STAGES } from '../lib/crmStages';

/** Initials for a person's name, e.g. "Priya Sharma" -> "PS". */
function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
}

export default function CRMPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const leads = useDataStore((s) => s.leads);
  const addRecord = useDataStore((s) => s.addRecord);
  const updateRecord = useDataStore((s) => s.updateRecord);
  const deleteRecord = useDataStore((s) => s.deleteRecord);
  const addToast = useUIStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (l: Lead) => { setEditing(l); setModalOpen(true); };

  const handleSubmit = async (values: Record<string, string | number>) => {
    if (editing) {
      await updateRecord('leads', editing.id, values);
      addToast({ message: 'Lead updated.', type: 'success' });
    } else {
      await addRecord('leads', values);
      addToast({ message: 'Lead added.', type: 'success' });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteRecord('leads', deleting.id);
      addToast({ message: 'Lead deleted.', type: 'success' });
      setDeleting(null);
    } catch (err) {
      addToast({ message: err instanceof Error ? err.message : 'Could not delete the lead.', type: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const editInitial = editing && {
    name: editing.name,
    partner: editing.partner,
    stage: editing.stage,
    revenue: editing.revenue,
    probability: editing.probability,
    owner_name: editing.user,
    tag: editing.tag,
  };

  const q = search.toLowerCase();
  const matchesSearch = (l: Lead) =>
    l.name.toLowerCase().includes(q) || l.partner.toLowerCase().includes(q) || l.user.toLowerCase().includes(q);

  const openLeads = leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost').length;
  const wonLeads = leads.filter((l) => l.stage === 'won');
  const pipelineValue = leads
    .filter((l) => l.stage !== 'won' && l.stage !== 'lost')
    .reduce((sum, l) => sum + l.revenue, 0);
  const wonValue = wonLeads.reduce((sum, l) => sum + l.revenue, 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="CRM"
        subtitle="Manage your leads and opportunities."
        actionLabel="New lead"
        onAction={openCreate}
      />

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-indigo stagger-1">
          <div className="kpi-label">Open Leads</div>
          <div className="kpi-value">{openLeads}</div>
          <div className="kpi-change">{leads.length} total in pipeline</div>
        </div>
        <div className="card kpi-card kpi-amber stagger-2">
          <div className="kpi-label">Pipeline Value</div>
          <div className="kpi-value">{formatMoney(pipelineValue)}</div>
          <div className="kpi-change">Open opportunities</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-3">
          <div className="kpi-label">Won Value</div>
          <div className="kpi-value">{formatMoney(wonValue)}</div>
          <div className="kpi-change">{wonLeads.length} deal{wonLeads.length === 1 ? '' : 's'} closed</div>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="crm"
            title="No leads yet"
            message="Add your first lead to start building your sales pipeline."
            actionLabel="New lead"
            onAction={openCreate}
          />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              className="tinput"
              placeholder="Search leads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 300 }}
            />
          </div>

          <div className="kanban-board" style={{ flex: 1 }}>
            {CRM_STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage.id && matchesSearch(l));
              const stageTotal = stageLeads.reduce((acc, l) => acc + l.revenue, 0);

              return (
                <div key={stage.id} className="kanban-column stagger-1">
                  <div className="kanban-col-header">
                    <div>
                      <div className="kanban-col-title" style={{ color: stage.color }}>{stage.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatMoney(stageTotal)} · {stage.probability}% prob
                      </div>
                    </div>
                    <div className="kanban-col-count">{stageLeads.length}</div>
                  </div>

                  <div className="kanban-cards">
                    {stageLeads.map((lead) => (
                      <div key={lead.id} className="kanban-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>
                            {lead.name}
                          </div>
                          <RowActions onEdit={() => openEdit(lead)} onDelete={() => setDeleting(lead)} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                          {lead.partner || '—'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            {formatMoney(lead.revenue)}
                          </span>
                          {lead.user && (
                            <div className="avatar avatar-sm" title={lead.user}>
                              {initialsOf(lead.user)}
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                          <span className={`badge ${lead.tag === 'Hot' ? 'badge-danger' : lead.tag === 'Warm' ? 'badge-warning' : 'badge-soft-primary'}`}>
                            {lead.tag}
                          </span>
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-disabled)', fontSize: '0.8125rem', border: '1.5px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
                        No leads match your filters.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {modalOpen && (
        <RecordModal
          title={editing ? 'Edit lead' : 'New lead'}
          submitLabel={editing ? 'Save changes' : 'Add lead'}
          fields={LEAD_FIELDS}
          initial={editInitial || undefined}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete lead?"
          message={`“${deleting.name}” will be removed from your pipeline. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
