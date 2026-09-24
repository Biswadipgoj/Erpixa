import { useState } from 'react';
import { useUIStore } from '../store';
import { useDataStore } from '../store/dataStore';
import type { Lead } from '../types';
import RecordModal from '../components/ui/RecordModal';
import { PageHeader, RowActions, EmptyState, ConfirmDialog, SearchInput } from '../components/ui/crud';
import { Stat, Stats } from '../components/ui/Stat';
import { LEAD_FIELDS } from '../lib/recordFields';
import { CRM_STAGES } from '../lib/crmStages';
import { moduleById } from '../lib/modules';
import { initialsOf } from '../lib/format';
import { stagger } from '../lib/motion';
import { useMoney } from '../lib/useMoney';

const TAG_TONE: Record<string, string> = { Hot: 'badge-danger', Warm: 'badge-warning', Cold: 'badge-info' };

export default function CRMPage() {
  const formatMoney = useMoney();
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

  const open = leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost');
  const wonLeads = leads.filter((l) => l.stage === 'won');
  const lostLeads = leads.filter((l) => l.stage === 'lost');
  const pipelineValue = open.reduce((sum, l) => sum + l.revenue, 0);
  const weighted = open.reduce((sum, l) => sum + l.revenue * (l.probability / 100), 0);
  const wonValue = wonLeads.reduce((sum, l) => sum + l.revenue, 0);
  const closed = wonLeads.length + lostLeads.length;
  const winRate = closed > 0 ? Math.round((wonLeads.length / closed) * 100) : null;

  return (
    <div className="page">
      <PageHeader
        eyebrow={moduleById('crm').group}
        icon="crm"
        title="CRM pipeline"
        subtitle={moduleById('crm').blurb}
        actionLabel="New lead"
        onAction={openCreate}
      >
        {leads.length > 0 && <SearchInput value={search} onChange={setSearch} placeholder="Filter the board…" />}
      </PageHeader>

      <Stats cols={3}>
        <Stat index={0} label="Open pipeline" value={pipelineValue} format={(v) => formatMoney(v)} caption={<><strong>{open.length}</strong> open deal{open.length === 1 ? '' : 's'}</>} tone="accent" icon="crm" />
        <Stat index={1} label="Weighted forecast" value={weighted} format={(v) => formatMoney(v)} caption="Each deal × its probability" tone="info" icon="target" />
        <Stat index={2} label="Won" value={wonValue} format={(v) => formatMoney(v)} caption={winRate === null ? 'No deals closed yet' : <><strong>{winRate}%</strong> win rate on {closed} closed</>} tone="success" icon="trend-up" />
      </Stats>

      {leads.length === 0 ? (
        <div className="card section">
          <EmptyState
            icon="crm"
            title="No leads yet"
            message="Add your first lead to start building your sales pipeline, stage by stage."
            actionLabel="New lead"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div className="kanban section" role="list" aria-label="Pipeline stages">
          {CRM_STAGES.map((stage, col) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id && matchesSearch(l));
            const stageTotal = stageLeads.reduce((acc, l) => acc + l.revenue, 0);
            return (
              <section key={stage.id} className="kanban-col" style={stagger(col)} role="listitem" aria-label={`${stage.name}, ${stageLeads.length} deals`}>
                <div className="kanban-head">
                  <div>
                    <div className="kanban-name">
                      <span className="kanban-swatch" style={{ background: stage.color }} aria-hidden="true" />
                      {stage.name}
                    </div>
                    <div className="kanban-meta">{formatMoney(stageTotal)} · {stage.probability}% likely</div>
                  </div>
                  <span className="kanban-count">{stageLeads.length}</span>
                </div>

                <div className="kanban-cards">
                  {stageLeads.map((lead, i) => (
                    <article key={lead.id} className="deal reveal-host" style={stagger(i + col)}>
                      <div className="deal-top">
                        <div style={{ minWidth: 0 }}>
                          <div className="deal-name">{lead.name}</div>
                          <div className="deal-partner truncate">{lead.partner || 'No company'}</div>
                        </div>
                        <RowActions label={lead.name} onEdit={() => openEdit(lead)} onDelete={() => setDeleting(lead)} />
                      </div>
                      <div className="deal-bottom">
                        <span className="deal-value">{formatMoney(lead.revenue)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {lead.tag && <span className={`badge ${TAG_TONE[lead.tag] ?? 'badge-neutral'}`}>{lead.tag}</span>}
                          {lead.user && (
                            <span className="avatar avatar-xs filled" style={{ background: 'var(--ink-2)', color: 'var(--paper)' }} title={lead.user}>
                              {initialsOf(lead.user)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="meter" title={`${lead.probability}% probability`}>
                        <i style={{ '--v': Math.min(100, lead.probability) / 100, background: stage.color } as React.CSSProperties} />
                      </div>
                    </article>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="empty-inline">{search ? 'No matches here' : 'Nothing in this stage'}</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
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
          title="Delete this lead?"
          message={`“${deleting.name}” will be removed from your pipeline. This can’t be undone.`}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
